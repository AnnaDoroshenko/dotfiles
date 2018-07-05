// Copyright Jason Savard

var localeMessages;
var accounts = [];
var ignoredAccounts = [];
var pollingAccounts = false;

var unreadCount;
var accountWithNewestMail;
var notificationAudio = new Audio();
// patch for Chrome 66: load and play first or else when an $.ajax call would return a 401 and subsequently playing an Audio would not work!
try {
	notificationAudio.src = SOUNDS_FOLDER + "chime.ogg";
	notificationAudio.volume = 0;
	notificationAudio.play();
} catch (error) {
	console.error(error);
}
var lastMailUpdate = new Date(1);
var lastNotificationAccountDates = [];
var lastNotificationDate = new Date(1);
var lastNotificationDateWhileActive = new Date(1); // unreadCountWhenShowNotificationWhileActive;
var lastNotificationAudioSource;
var voiceMessageAudio;

var oAuthForEmails;
var oAuthForContacts;
var oAuthForPeople;
var oAuthForProfiles;

var emailAccountRequestingOauth;

var subjects = [];
var notification;
var checkEmailTimer;
var richNotifId;
var richNotifMails = [];
var richNotifButtonsWithValues;
var lastShowNotifParams;
var unauthorizedAccounts;
var checkingEmails = false;
var buttonIcon;

var quickComposeEmailMenuId;
var sendPageLinkMenuId;
var sendPageLinkToContactMenuId;
var sendPageLinkToContactWithMessageMenuId;
var lastGmailAPIActionByExtension = new Date(1);

var uninstallEmail;
var soundSource;

//init objects once in this background page and read them from all other views (html/popup/notification pages etc.)
Settings({defaults:DEFAULT_SETTINGS, defaultsForOauth:DEFAULT_SETTINGS_FOR_OAUTH, extraFeatures:SETTINGS_EXTRA_FEATURES});
ChromeTTS();
Controller();

var settingsPromise = Settings.load();

var detectSleepMode = new DetectSleepMode(function() {
	// wakeup from sleep mode action...
	if (getAccountsSummary(accounts).signedIntoAccounts >= 1) {
		console.log("hasAtleastOneSuccessfullAccount - so don't check")
	} else {
		checkEmails("wakeupFromSleep");
	}
});

// Methods declared for "html-css-sanitizer-minified.js"
function allowAllUrls(url, mime) { return url; }
function rewriteIds(id) { return HTML_CSS_SANITIZER_REWRITE_IDS_PREFIX + id; }
//Loosen restrictions of Caja's html-sanitizer to allow for styling
html4.ATTRIBS['*::style'] = 0;
html4.ATTRIBS['*::background'] = 0;
html4.ATTRIBS['a::target'] = 0;
html4.ATTRIBS['audio::src'] = 0;
html4.ATTRIBS['video::src'] = 0;
html4.ATTRIBS['video::poster'] = 0;
html4.ATTRIBS['video::controls'] = 0;
html4.ATTRIBS['video::autoplay'] = 0;
html4.ATTRIBS['video::controls'] = 0;
html4.ELEMENTS['audio'] = 0;
html4.ELEMENTS['video'] = 0;

function getSettings() {
   return Settings;
}

function firstInstall() {
	// Note: Install dates only as old as implementation of this today, Dec 14th 2013
	Settings.store("installDate", new Date());
	Settings.store("installVersion", chrome.runtime.getManifest().version);
	
	// only show options if NOT locked
	if (Settings.read("settingsAccess") != "locked") {
		var optionsUrl = chrome.runtime.getURL("options.html?action=install");
		chrome.tabs.create({url: "https://jasonsavard.com/thankYouForInstalling?app=gmail&optionsUrl=" + encodeURIComponent(optionsUrl)});
	}
	
	sendGA("installed", chrome.runtime.getManifest().version);
}

// seems alert()'s can stop the oninstalled from being called
if (chrome.runtime.onInstalled) {
	chrome.runtime.onInstalled.addListener(details => {
		//console.log("onInstalled: " + details.reason);
	
		settingsPromise.then(() => {
			// patch: when extension crashes and restarts the reason is "install" so ignore if it installdate exists
			if (details.reason == "install" && !Settings.read("installDate")) {
				firstInstall();
			} else if (details.reason == "update") {
				// seems that Reloading extension from extension page will trigger an onIntalled with reason "update"
				// so let's make sure this is a real version update by comparing versions
				var realUpdate = details.previousVersion != chrome.runtime.getManifest().version;
				if (realUpdate) {
					console.log("real version changed");
					// extension has been updated to let's resync the data and save the new extension version in the sync data (to make obsolete any old sync data)
					// but let's wait about 60 minutes for (if) any new settings have been altered in this new extension version before saving syncing them
					chrome.alarms.create("extensionUpdatedSync", {delayInMinutes:60});
				}
				
				var previousVersionObj = parseVersionString(details.previousVersion)
				var currentVersionObj = parseVersionString(chrome.runtime.getManifest().version);
				if ((Settings.read("extensionUpdates") == "all" && realUpdate) || (Settings.read("extensionUpdates") == "interesting" && (previousVersionObj.major != currentVersionObj.major || previousVersionObj.minor != currentVersionObj.minor))) {
					//if (details.previousVersion != "16.5") { // details.previousVersion != "16.2" && details.previousVersion != "16.3" && details.previousVersion != "16.4"
						var options = {
								type: "basic",
								title: getMessage("extensionUpdated"),
								message: "Checker Plus for Gmail " + chrome.runtime.getManifest().version,
								iconUrl: Icons.NOTIFICATION_ICON_URL,
								buttons: [{title: getMessage("seeUpdates"), iconUrl: "images/notifButtons/open.svg"}, {title: getMessage("doNotNotifyMeOfUpdates"), iconUrl: "images/notifButtons/DND.svg"}]
						}
						
						chrome.notifications.create("extensionUpdate", options, function(notificationId) {
							if (chrome.runtime.lastError) {
								console.error(chrome.runtime.lastError.message);
							}
						});
					//}
				}
			}		
		});
	});
} else {
	settingsPromise.then(() => {
		if (!Settings.read("installDate")) {
			firstInstall();
		}
	});
}

if (chrome.alarms) {
	chrome.alarms.create("updateContacts", { periodInMinutes:60 * 4 }); // = 4 hours (used to be every 24 hours)
	chrome.alarms.create("updateSkins", { periodInMinutes: 60 * 24 }); // = 24 hours (used to be every 48 hours)
	chrome.alarms.create("syncSignInOrder", { periodInMinutes: 60 * 24 * 5 }); // = 5 days
}

if (chrome.gcm) {
	
	var MIN_SECONDS_BETWEEN_MODIFICATIONS_BY_EXTENSION_AND_GCM_MESSAGES = 15;
	var MIN_SECONDS_BETWEEN_GET_EMAILS = 5;
	var MIN_SECONDS_BETWEEN_PROCESSING_GCM_MESSAGES = 1;
	var getEmailsTimer;
	
	chrome.gcm.onMessage.addListener(message => {
		console.log("gcm.onMessage", new Date(), message);
		if (message.from == GCM_SENDER_ID) {
			// detect push notifiation about change
			if (message.data.historyId) {
				if (Settings.read("poll") == "realtime") {
					// reset check email timer (as a backup it runs every 5min)
					restartCheckEmailTimer(true);

					var account = getAccountByEmail(message.data.email);
					if (account) {
						if (!account.getHistoryId() || message.data.historyId > account.getHistoryId()) {
							var delay;
							if (lastGmailAPIActionByExtension.diffInSeconds() >= -MIN_SECONDS_BETWEEN_MODIFICATIONS_BY_EXTENSION_AND_GCM_MESSAGES) { // avoid race condition
								delay = seconds(MIN_SECONDS_BETWEEN_MODIFICATIONS_BY_EXTENSION_AND_GCM_MESSAGES);
							} else if (account.lastGetEmailsDate.diffInSeconds() < -MIN_SECONDS_BETWEEN_GET_EMAILS) {
								delay = 0;
							} else {
								delay = seconds(MIN_SECONDS_BETWEEN_PROCESSING_GCM_MESSAGES);
							}
							
							clearTimeout(getEmailsTimer);
							getEmailsTimer = setTimeout(() => {
								//sendGA("gcm", "getEmails");
								account.getEmails().then(() => {
									mailUpdate({showNotification:true});
								}).catch(error => {
									// nothing
								});
							}, delay);
						} else {
							console.warn("historyId is old: " + message.data.historyId);
						}
					}
				}
			} else {
				console.warn("Unknown message", message);
			}
		} else {
			console.warn("Unknown message sender: " + message.from);
		}
	});
	
	chrome.gcm.onMessagesDeleted.addListener(response => {
		console.log("messages deleted: ", response);
	});
	
	chrome.gcm.onSendError.addListener(error => {
		console.error("Message " + error.messageId + " failed to be sent: " + error.errorMessage);
	});	
}

function setUninstallUrl(email) {
	if (chrome.runtime.setUninstallURL) {
		var url = "https://jasonsavard.com/uninstalled?app=gmail";
		url += "&version=" + encodeURIComponent(chrome.runtime.getManifest().version);
		url += "&daysInstalled=" + daysElapsedSinceFirstInstalled();
		if (email && !/mail\.google\.com/.test(email)) {
			url += "&e=" + encodeURIComponent(btoa(email));
			uninstallEmail = email;
		}
		chrome.runtime.setUninstallURL(url);
	}
}
// set this initially in case we never get more details like email etc.
setUninstallUrl();

if (chrome.notifications) {
	
	// clicked anywhere
	chrome.notifications.onClicked.addListener(function(notificationId) {
		console.log("notif onclick", notificationId, richNotifMails);
		
		if (notificationId == "extensionUpdate") {
			openUrl("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail_changelog");
			chrome.notifications.clear(notificationId, function() {});
			sendGA("extensionUpdateNotification", "clicked notification");
		} else if (notificationId == "error") {
			openUrl(Urls.NotificationError);
			chrome.notifications.clear(notificationId, function() {});
			sendGA("errorNotification", "clicked notification");
		} else if (notificationId == "extensionConflict") {
			openUrl(Urls.ExtensionConflict);
			chrome.notifications.clear(notificationId, function() {});
			sendGA("errorNotification", "clicked notification");
		} else {
			stopAllSounds();
			var notificationButtonValue = Settings.read("notificationClickAnywhere");
			performButtonAction({notificationButtonValue:notificationButtonValue, notificationId:notificationId, richNotifMails:richNotifMails});
		}
	});

	// buttons clicked
	chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
		if (notificationId == "extensionUpdate") {
			if (buttonIndex == 0) {
				openUrl("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail_changelog");
				chrome.notifications.clear(notificationId, function() {});
				sendGA("extensionUpdateNotification", "clicked button - see updates");
			} else if (buttonIndex == 1) {
				Settings.store("extensionUpdates", "none");
				chrome.notifications.clear(notificationId, function(wasCleared) {
					// nothing
				});
				sendGA("extensionUpdateNotification", "clicked button - do not show future notifications");
			}
		} else if (notificationId == "message") {
			// nothing
		} else if (notificationId == "error") {
			openUrl(Urls.NotificationError);
			chrome.notifications.clear(notificationId, function() {});
			sendGA("errorNotification", "clicked button on notification");
		} else if (notificationId == "extensionConflict") {
			openUrl(Urls.ExtensionConflict);
			chrome.notifications.clear(notificationId, function() {});
			sendGA("errorNotification", "clicked button on notification");
		} else {
			stopAllSounds();
			var notificationButtonValue = richNotifButtonsWithValues[buttonIndex].value;
			performButtonAction({notificationButtonValue:notificationButtonValue, notificationId:notificationId, richNotifMails:richNotifMails});
		}
	});
	
	// closed notif
	chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
		console.log("notif onclose", notificationId, byUser, new Date());
		
		if (notificationId == "extensionUpdate") {
			if (byUser) {
				sendGA("extensionUpdateNotification", "closed notification");
			}
		} else if (notificationId == "message") {
			// nothing
		} else if (notificationId == "error") {
			// nothing
		} else {
			richNotifId = null;
			
			// Chrome <=60 byUser happens ONLY when X is clicked ... NOT by closing browser, NOT by clicking action buttons, ** NOT by calling .clear
			// Chrome 61 update: calling .clear will set byUser = true
			if (byUser && !window.notificationClosedByDuration) {
				stopAllSounds();
			}
			// reset value
			window.notificationClosedByDuration = false;
		}
	});
}

if (chrome.runtime.onMessageExternal) {

	sendFVDInfo();

	chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
		if (message === "mgmiemnjjchgkmgbeljfocdjjnpjnmcg-poke") {
			var info = {
					  "poke"    :   2,              // poke version 2
					  "width"   :   1,              // 406 px default width
					  "height"  :   1,              // 200 px default height
					  "path"    :   "widget.html",
					  "v2"      :   {
					                  "resize"    :   true,  // Set to true ONLY if you create a range below.
					                  "min_width" :   1,     // 200 px min width
					                  "max_width" :   3,     // 406 px max width
					                  "min_height":   1,     // 200 px min height
					                  "max_height":   3      // 200 px max height
					                }
					};
			
			chrome.runtime.sendMessage(
				  sender.id, {
					  head: "mgmiemnjjchgkmgbeljfocdjjnpjnmcg-pokeback",
					  body: info
				  }
			);
		} else if (sender.id == "blacklistedExtension") {
			//sendResponse({});  // don't allow this extension access
		} else if (message.action == "turnOffDND") {
			setDND_off(true);
			sendResponse();
		} else if (message.action == "setDNDEndTime") {
			var endTime = new Date(message.endTime);
			if (!message.triggeredByCalendarExtension) {
				setDNDEndTime(endTime, true);
			} else if (message.triggeredByCalendarExtension && Settings.read("dndDuringCalendarEvent")) {
				// only overrite endtime from calendar extension if it's longer than the user's specifically set end time
				if (!Settings.read("DND_endTime") || endTime.isAfter(Settings.read("DND_endTime"))) {
					setDNDEndTime(endTime, true);
				}
			}
			sendResponse();
		} else if (message.action == "getEventDetails") {
			// do not sendresponse here because we are alredy litening for this event in the popup window context
		} else if (message.action == "getInfo") {
			sendResponse({installed:true});
		}
	});
}

// Add listener once only here and it will only activate when browser action for popup = ""
chrome.browserAction.onClicked.addListener(function(tab) {
	
	var checkerPlusElseCompose = Settings.read("browserButtonAction") == BROWSER_BUTTON_ACTION_CHECKER_PLUS && Settings.read("checkerPlusBrowserButtonActionIfNoEmail") == BROWSER_BUTTON_ACTION_COMPOSE && unreadCount === 0;
	var gmailInboxElseCompose = Settings.read("browserButtonAction") == BROWSER_BUTTON_ACTION_GMAIL_INBOX && Settings.read("gmailPopupBrowserButtonActionIfNoEmail") == BROWSER_BUTTON_ACTION_COMPOSE && unreadCount === 0;
	
	if (Settings.read("browserButtonAction") == BROWSER_BUTTON_ACTION_CHECKER_PLUS_POPOUT) {
		openInPopup();
	} else if (Settings.read("browserButtonAction") == BROWSER_BUTTON_ACTION_COMPOSE || checkerPlusElseCompose || gmailInboxElseCompose) {
		// open compose mail
		if (accounts.length) {
			getFirstActiveAccount(accounts).openCompose();
		} else {
			openUrl(getSignInUrl());
		}
	} else {
		// open Gmail
		var accountId = 0;
		getActiveAccounts(accounts).some(function(account, i) {
			if (account.getUnreadCount() > 0) {
				accountId = account.id;
				return true;
			}
		});

		// means not signed in so open gmail.com for user to sign in
		var accountToOpen = getAccountById(accountId);
		if (accountToOpen) {
			var params = {};
			if (Settings.read("browserButtonAction") == BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB || Settings.read("checkerPlusBrowserButtonActionIfNoEmail") == BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB) {
				params.openInNewTab = true;
			}
			accountToOpen.openInbox(params);
		} else {
			console.error("No mailaccount(s) found with account id " + accountId);		
			openUrl(getSignInUrl());
		}
	}
});

$(document).ready(function() {
	init();
});

function maybeAppendAllMsg(msg, emails) {
	if (emails.length == 1) {
		return msg;
	} else {
		return msg + " (" + getMessage("all") + ")";
	}
}

function generateNotificationButton(buttons, buttonsWithValues, value, emails) {
	if (value) {
		var button;
		
		if (value == "markAsRead") {
			button = {title:maybeAppendAllMsg(getMessage("readLink"), emails), iconUrl:"images/notifButtons/checkmark.svg"};
		} else if (value == "delete") {
			button = {title:maybeAppendAllMsg(getMessage("delete"), emails), iconUrl:"images/notifButtons/trash.svg"};
		} else if (value == "archive") {
			button = {title:maybeAppendAllMsg(getMessage("archiveLink"), emails), iconUrl:"images/notifButtons/archive.svg"};
		} else if (value == "spam") {
			button = {title:maybeAppendAllMsg(getMessage("spamLinkTitle"), emails), iconUrl:"images/notifButtons/spam.svg"};
		} else if (value == "star") {
			button = {title:maybeAppendAllMsg(getMessage("starLinkTitle"), emails), iconUrl:"images/notifButtons/star.svg"};
		} else if (value == "starAndArchive") {
			button = {title:maybeAppendAllMsg(getMessage("starAndArchive"), emails), iconUrl:"images/notifButtons/star.svg"};
		} else if (value == "open") {
			button = {title:getMessage("open"), iconUrl:"images/notifButtons/open.svg"};
		} else if (value == "openInNewTab") {
			button = {title:getMessage("open"), iconUrl:"images/notifButtons/open.svg"};
		} else if (value == "openInPopup") {
			button = {title:getMessage("open"), iconUrl:"images/notifButtons/open.svg"};
		} else if (value == "reply") {
			button = {title:getMessage("reply"), iconUrl:"images/notifButtons/reply.svg"};
		} else if (value == "replyInPopup") {
			button = {title:getMessage("reply"), iconUrl:"images/notifButtons/reply.svg"};
		} else if (value == "reducedDonationAd") {
			button = {title:getMessage("reducedDonationAd_notification", "50¢")};
		} else if (value == "markDone") {
			button = {title:maybeAppendAllMsg(getMessage("markDone"), emails), iconUrl:"images/notifButtons/checkmark.svg"};
		}

		if (button) {
			buttons.push(button);
			
			var buttonWithValue = clone(button);
			buttonWithValue.value = value;
			buttonsWithValues.push(buttonWithValue);
		}
	}
}

function clearRichNotification(notificationId) {
	return new Promise((resolve, reject) => {
		if (notificationId) {
			chrome.notifications.clear(notificationId, function() {
				richNotifMails = [];
				resolve();
			});
		} else {
			richNotifMails = [];
			resolve();
		}
	});
}

function canDisplayImageInNotification($image) {
	var src = $image.attr("src");	
	
	var imageRemovedBySender = false;
	if ($image.attr("alt") && $image.attr("alt").indexOf("Image removed by sender") != -1) {
		imageRemovedBySender = true;
	}
	
	if (src && (src.parseUrl().hostname.indexOf(".google.com") != -1 || src.parseUrl().hostname.indexOf(".googleusercontent.com")) && !imageRemovedBySender) { // src.indexOf("/proxy/") == -1
		return true;
	} else {
		return false;
	}
}

// watch out for returns here, we don't want to callback twice or not callback at all!
function fetchEmailImagePreview(options, mail, callback) {
	if (Settings.read("showNotificationEmailImagePreview")) {
		
		if (Settings.read("accountAddingMethod") == "autoDetect") {
			
			// image domain host must be in permissions manifest or else notifications.create gives me download image errors and notification does not appear!
			if (chrome.permissions) {
				chrome.permissions.contains({origins: [Origins.ALL]}, function(result) {
					var skipLastCallback;
					
					if (result) {
						if (mail.messages && mail.messages.last()) {
							var $messageContent = parseHtmlToJQuery(mail.messages.last().content);
							console.log("mail.messages", $messageContent);
							fixRelativeLinks($messageContent, mail);
							
							$messageContent.find("img, imghidden").each(function(index, image) {
								var $image = $(image);
								var src = $image.attr("src");
								
								// do not show common gmail images such as these by ignore /images/
								// .vcf icon = https://mail.google.com/mail/u/0/images/generic.gif
								// .wav icon = https://mail.google.com/mail/u/0/images/sound.gif	
								// /proxy/ used by Google news letters https://ci6.googleusercontent.com/proxy/b0dQF6UdprOZnNdy4YkkZRZYSz4OKeP6tnNaKKhKAHzc5DoRLm-6T9Ofs1I_nxTMa7p63sQXCvlyhmMf4nIKJxbU6hMDZ46Wv5esDXgENaw2csOyvTEfyb2ycnSEic4Yi7N81kiF=s0-d-e1-ft#https://www.gstatic.com/gmktg/mtv-img/cloudplatform_hero_image_2014_mar_w538.jpg
								// google logo 						   https://ci4.googleusercontent.com/proxy/GYehbMfqpOfmkZni3YXcVpYFnSdFa4_3HNmCzVHxFFhtCBk_QulXrkB97v_UVSU0gt8t42RnDKOqw0SvszkMjvrdKHZjm3UErjYHQI7vsurAMj3tGuzIFiqw8xIvgCy_aoN9ujcdkHDJYGLdO9h6jySufmfLtNIRr8tXVfdR=s0-d-e1-ft#https://ssl.gstatic.com/s2/oz/images/notifications/logo/google-plus-6617a72bb36cc548861652780c9e6ff1.png
								// twitter profile image: https://ci4.googleusercontent.com/proxy/6gEsiJis1bR3V0VjLSVPlXWkvG5gpih1SXl76ZtlPej0gbvzyT5csZHqRvspHtFm6RSN3GMjr341ggvV8bL1kUfidvh40p5QhrHlZHUgvGD9Rzzka29xynqxWPMupf5w0YCPXAterd8WXA=s0-d-e1-ft#https://pbs.twimg.com/profile_images/1710068300/avatar-sel-port_reasonably_small.jpg
								// pinterest logos "/logo" ... https://ci4.googleusercontent.com/proxy/FljV4IcGHkNGLK57gCiy7cBamDrSWta_-7hOh_NMFw5xEjJo3MUga5TaUfk3gGcoZ2HQTvCgLoEUu60kokQkHWfke_Zg0QENUV_Z4flLXGIYhV7As6dHwGc=s0-d-e1-ft#http://email-assets.pinterest.com/email/shared/brand/logo_large.gif
	
								if (src && canDisplayImageInNotification($image) && src.parseUrl().pathname.indexOf("/images/") == -1 && src.indexOf("notifications/") == -1 && src.indexOf("/logo") == -1) {
									// hostname is .google.com if they embedded the image
									// hostname is .googleusercontent.com if they in Gmail > clicked Insert Photo > by Web address (URL)							
									if (src.parseUrl().hostname.indexOf(".google.com") != -1) {
										options.type = "image";
										// assign default low res embedded image
										options.imageUrl = src;
										
										// see if we can change that default image with hig res image
										if (src.indexOf("disp=thd") != -1) {
											var fullImageImage = new Image();
											var fullImageSrc = src.replace("disp=thd", "disp=inline");
											
											skipLastCallback = true;
											ajax(fullImageSrc)
												.then(data => {
													options.imageUrl = fullImageSrc;
													callback();
												})
												.catch(jqXHR => {
													logError("could not load preview image: " + jqXHR.statusText, jqXHR);
													callback();
												})
											;
										}
										// exit image loop
										return false;
									} else {
										// Google+ email: let's pull the first image as iconurl and 2nd as the imageurl
										if (mail.authorMail && mail.authorMail.indexOf("@plus.google.com") != -1) { //noreply-2fe90779@plus.google.com
											// detect 1st profile photo
											if (src.indexOf("photo.jpg") != -1) {
												var callbackParams = {};
												callbackParams.detectedIconUrl = src;
												
												// find a posted large photo if in the email...
												$messageContent.find("img, imghidden").each(function(index, image) {
													// skip any other possible "profile photos" until we find one without a width
													// profile pic: <img width="75" height="75" style="border:solid 1px #cccccc" src="https://lh5.googleusercontent.com/-AaGu6jEK0vQ/AAAAAAAAAAI/AAAAAAAAPyw/Ri1xBFp8ZTk/s75-c-k-a-no/photo.jpg"></a></td>
													// attached pic: https://lh4.googleusercontent.com/-zZ09UJ_sZeM/UyKo78Wy74I/AAAAAAAFPUc/uR1p1NvrCd8/w506-h750/1979464_675320629180179_9739741_n.jpg
													// and no static images like Google+ image found at this ex. url: https://ssl.gstatic.com/s2/oz/images/notifications/logo/google-plus-6617a72bb36cc548861652780c9e6ff1.png
													console.log("detected image: " + $(image).attr("src"));
													if (!$(image).attr("width") && canDisplayImageInNotification($(image)) && $(image).attr("src") && $(image).attr("src").indexOf("notifications/") == -1) {
														options.type = "image";
														options.imageUrl = $(image).attr("src");
														return false;
													}
												});
												
												skipLastCallback = true;
												callback(callbackParams);
												return false;
											}
										} else if (mail.authorMail && mail.authorMail.indexOf("@facebookmail.com") != -1) {
											// https://ci3.googleusercontent.com/proxy/g96-WnOcJ8aMpwH8MgjPEGTy5Q32qaOHpaF30q0s6tJRXXxs8yRr5jFkDIWAX_-wDIkjnoGpvMmPqJp_GGHk4U5yhSmUiBmDma-tPDyIE7Y_2-jWYC0PmPxhRU8mcSqqJxoqi27HTYG6sh9Jcbzsuw=s0-d-e1-ft#https://fbcdn-profile-a.akamaihd.net/hprofile-ak-prn2/t5/1117010_779426678_323617099_q.jpg
											if (src.indexOf("profile") != -1) {
												var callbackParams = {};
												callbackParams.detectedIconUrl = src;
												skipLastCallback = true;
												callback(callbackParams);
												return false;
											}
										} else if (($image.attr("width") && $image.attr("width") >= PREVIEW_IMAGE_MIN_WITDH_HEIGHT) && ($image.attr("height") && $image.attr("height") >= PREVIEW_IMAGE_MIN_WITDH_HEIGHT)) {
											options.type = "image";
											options.imageUrl = src;
											// exit image loop
											return false;
										} else { // could not determine width/height
											// Get the real width/height											
											var $copyOfImage = $("<img/>") // Make in memory copy of image to avoid css issues
											$copyOfImage.attr("src", src);
	
											skipLastCallback = true;
											
											loadImage($copyOfImage).then($thisImage => {
												var thisImage = $thisImage[0];
												console.log("copy image width/height: ", thisImage, thisImage.width + "/" + thisImage.height);
												// Note: $(this).width() will not work for in memory images.
												if (thisImage.width >= PREVIEW_IMAGE_MIN_WITDH_HEIGHT && thisImage.height >= PREVIEW_IMAGE_MIN_WITDH_HEIGHT) {
													options.type = "image";
													options.imageUrl = src;
												}
											}).catch(errorResponse => {
												logError("could not load image: " + src + " " + errorResponse);
											}).then(() => {
												callback({});
											});
	
											// exit image loop
											return false;
										}									
									}
								} else {
									console.log("did not pass image tests");
								}
							});
						}
					}
					
					if (!skipLastCallback) {
						callback();
					}
				});
			} else {
				callback();
			}
			// because we return here, make sure we call callback everywhere before this line
			return;
		} else {
			// oauth
			var skipLastCallback;
			if (mail.messages && mail.messages.last()) {
				var lastMessage = mail.messages.last();
				var foundPossibleImage = lastMessage.files.some(function(file, fileIndex) {
					if (file.mimeType && file.mimeType.indexOf("image/") == 0 && file.body.size >= PREVIEW_IMAGE_MIN_SIZE && file.body.size < PREVIEW_IMAGE_MAX_SIZE) {
						var queuedFile = mail.queueFile(lastMessage.id, file);
						queuedFile.fetchPromise.then(function(response) {
							options.type = "image";
							options.imageUrl = generateBlobUrl(response.data, file.mimeType);
							console.log("mimetype: " + file.mimeType);
						}).catch(function(errorResponse) {
							logError("could not fetch preview image (oauth) " + errorResponse.message);
						}).then(function() {
							callback();
						});
						return true;
					}
				});

				if (foundPossibleImage) {
					skipLastCallback = true;
				}
			}
			
			if (!skipLastCallback) {
				callback();
			}
			return;
		}
	}
	callback();
}

function ensureDoNotShowNotificationIfGmailTabOpenTest(params) {
	return new Promise((resolve, reject) => {
		params = initUndefinedObject(params);
		if (params.testType) {
			resolve(true);
		} else if (Settings.read("doNotShowNotificationIfGmailTabOpen") && accountWithNewestMail) {
			// url: must be URL pattern like in manifest ex. http://abc.com/* (star is almost mandatory)
			chrome.tabs.query({url:accountWithNewestMail.getMailUrl() + "*"}, function(tabs) {
				console.log("gmail tabs: ", tabs);
				if (tabs && tabs.length) {
					console.warn("Not showing notification because of option: doNotShowNotificationIfGmailTabOpen");
					resolve(false);
				} else {
					resolve(true);
				}
			});
		} else {
			resolve(true);
		}
	});
} 

function showNotification(params) {
	return new Promise((resolve, reject) => {

		lastNotificationDate = new Date();
		chrome.idle.queryState(60, newState => {
			console.log("show notif state: " + newState + " " + now());
			if (newState == "active") {
				lastNotificationDateWhileActive = new Date();
			}
		});
		
		var notificationDisplay = Settings.read("notificationDisplay");
		
		params = initUndefinedObject(params);
	
		if (Settings.read("desktopNotification")) {
			getDNDState().then(dndState => {
				if (dndState) {
					resolve("DND is enabled");
				} else {
					ensureDoNotShowNotificationIfGmailTabOpenTest(params).then(passedDoNotShowNotificationIfGmailTabOpenTest => {
						if (passedDoNotShowNotificationIfGmailTabOpenTest) {
							var firstEmail;
							if (params.emails) {
								firstEmail = params.emails.first();
							}
							if (!firstEmail) {
								var error = "Could not find any emails";
								console.error(error);
								reject(error);
								return;
							}
							
							var NOTIFICATION_DISABLE_WARNING = "Normally a notification for this email or some of these emails will not appear because you unchecked the notification in your Accounts/Labels settings for this particular email/label";
							
							var notificationFlagForLabelsOfNewestEmail;
							if (firstEmail) {
								notificationFlagForLabelsOfNewestEmail = getSettingValueForLabels(firstEmail.account, firstEmail.account.getSetting("notifications"), firstEmail.labels, Settings.read("desktopNotification"));
							}			
			
							var textNotification = params.testType == "text" || (params.testType == undefined && Settings.read("desktopNotification") == "text");
							var richNotification = params.testType == "rich" || (params.testType == undefined && Settings.read("desktopNotification") == "rich");
			
							if (textNotification || !chrome.notifications) {
								// text window
								if (notificationFlagForLabelsOfNewestEmail || params.testType) {					
									var fromName = generateNotificationDisplayName(firstEmail);
									
									var subject = firstEmail.title;
									if (subject == null) {
										subject = "";
									}
									
									var body = firstEmail.getLastMessageText({maxSummaryLetters:101, htmlToText:true});
					
									if (window.Notification) {
										
										var title = "";
										
										if (accounts.length >= 2 && Settings.read("displayAccountReceivingEmail")) {
											title = firstEmail.account.getEmailDisplayName() + "\n";
										}
										
										if (notificationDisplay == "newEmail") {
											title += getMessage("newEmail");
											body = "";
										} else if (notificationDisplay == "from") {
											title += fromName;
											body = "";
										} else if (notificationDisplay == "from|subject") {
											title += fromName
											body = subject;
										} else {
											title += formatEmailNotificationTitle(fromName, subject);
										}
										
										body = shortenUrls(body);
										
										notification = new Notification(title, {body:body, icon:"/images/icons/icon_48.png", requireInteraction: true});
										notification.mail = firstEmail;
										notification.onclick = function() {
											firstEmail.open();
											if (notification) {
												notification.close();
											}
										}
										notification.onshow = function() {
											resolve();
										}
										notification.onclose = function() {
											console.log("onclose notification");
											notification = null;
										}
										notification.onerror = function(e) {
											//logError("showNotification error: " + e);
											reject("onerror with notification");
										}
										
										var showNotificationDuration = Settings.read("showNotificationDuration");
										
										if (!isNaN(showNotificationDuration)) {
											setTimeout(function () {
												if (notification) {
													notification.close();
												}
											}, seconds(showNotificationDuration));
										}
									} else {
										var error = "This browser does not support these notifications";
										console.warn(error);
										reject(error);
									}
								} else {
									var error = "Notification disabled for this email";
									console.warn(error);
									reject(error);
								}
							} else if (richNotification) {
								// rich notif
								
								console.log("rich params: ", params);
			
								var iconUrl = Icons.NOTIFICATION_ICON_URL;
								
								var buttons = [];
								var buttonsWithValues = []; // used to associate button values inside notification object
								var buttonValue;
								
								buttonValue = Settings.read("notificationButton1");
								generateNotificationButton(buttons, buttonsWithValues, buttonValue, params.emails);
								
								var buttonValue;
								if (shouldShowReducedDonationMsg()) {
									buttonValue = "reducedDonationAd";
								} else {
									buttonValue = Settings.read("notificationButton2");
								}				
								generateNotificationButton(buttons, buttonsWithValues, buttonValue, params.emails);
								
								var options;
			
								if (params.emails.length == 1) {
									// single email
									
									if (notificationFlagForLabelsOfNewestEmail || params.testType) {
										var fromName = generateNotificationDisplayName(firstEmail);
					
										var subject = "";
										if (firstEmail.title) {
											//subject = firstEmail.title.htmlToText();
											subject = firstEmail.title;
											if (subject == null) {
												subject = "";
											}
										}
					
										options = {
											type: "basic",
											title: "",
											message: "",
											iconUrl: iconUrl
										}

										// Window Chrome notificatins can display 2 bold + 3 regular lines
										// Mac only 1 bold + 2 regular lines
										let manyLinesNotifs = !DetectClient.isMac();

										if (accounts.length >= 2 && Settings.read("displayAccountReceivingEmail")) {
											options.title = firstEmail.account.getEmailDisplayName();
											if (manyLinesNotifs) {
												options.title += "\n";
											}
										}

										let canUseTitle = manyLinesNotifs || !options.title;
										
										if (notificationDisplay == "newEmail") {
											if (canUseTitle) {
												options.title += getMessage("newEmail");
											} else {
												options.message = getMessage("newEmail");
											}
										} else if (notificationDisplay == "from") {
											if (canUseTitle) {
												options.title += fromName;
											} else {
												options.message = fromName;
											}
										} else if (notificationDisplay == "from|subject") {
											if (canUseTitle) {
												options.title += fromName
												options.message = subject;
											} else {
												options.message = fromName + "\n" + subject;
											}
										} else {
											let emailMessage = firstEmail.getLastMessageText({ maxSummaryLetters: 170, htmlToText: true, EOM_Message: " [" + getMessage("EOM") + "]" });
											if (!emailMessage) {
												emailMessage = "";
											}
											emailMessage = shortenUrls(emailMessage);

											if (canUseTitle) {
												options.title += formatEmailNotificationTitle(fromName, subject);
												options.message = emailMessage;
											} else {
												options.message = formatEmailNotificationTitle(fromName, subject) + "\n" + emailMessage;
											}
										}
										
										if (DetectClient.isChrome()) {
											options.buttons = buttons;
										}
										
										fetchEmailImagePreview(options, firstEmail, fetchEmailImagePreviewResult => {
											preloadProfilePhotos(params.emails, () => {
												var email = params.emails.first();
												if (email.contactPhoto && email.contactPhoto.src) {									
													console.log("iconUrl: " + email.contactPhoto.src);
													options.iconUrl = email.contactPhoto.src;
												} else {
													if (fetchEmailImagePreviewResult && fetchEmailImagePreviewResult.detectedIconUrl) {
														console.log("iconUrl2: " + email.contactPhoto.src);
														options.iconUrl = fetchEmailImagePreviewResult.detectedIconUrl;
													}
												}
												let notificationParams = {
													options: options,
													buttonsWithValues: buttonsWithValues,
													newEmails: params.emails
												}
												openNotification(notificationParams).then(notificationId => {
													if (notificationFlagForLabelsOfNewestEmail) {
														resolve();
													} else {
														resolve(NOTIFICATION_DISABLE_WARNING);
													}
												}).catch(error => {
													reject(error);
												});
											});
										});
									} else {
										var warning = "Notification disabled for this email";
										console.warn(warning);
										resolve(warning);
									}
								} else {
									var items = [];
									
									$.each(params.emails, function(index, email) {
										
										console.log("item.push:", email);
										
										var subject = email.title;
										if (subject) {
											subject = subject.htmlToText();
										}
										if (!subject) {
											subject = "";
										}
										
										var item = {};
										
										if (notificationDisplay == "from") {
											item.title = generateNotificationDisplayName(email);
											item.message = "";
										} else if (notificationDisplay == "from|subject") {
											item.title = generateNotificationDisplayName(email);
											item.message = subject;
										} else {
											item.title = formatEmailNotificationTitle(generateNotificationDisplayName(email), subject);
											var message = email.getLastMessageText();
											if (message) {
												message = message.htmlToText();
											}
											if (!message) {
												message = "";
											}
											item.message = message;
										}
										
										items.push(item);
									});
			
									options = {
										message: "",
										iconUrl: iconUrl
									}
									
									if (DetectClient.isChrome()) {
										options.buttons = buttons;
									}
			
									if (notificationDisplay == "newEmail") {
										options.type = "basic";
									} else {
										if (DetectClient.isChrome()) {
											options.type = "list";
											options.items = items;
										} else {
											options.type = "basic";
											var str = "";
											items.forEach(function(item, index) {
												str += item.title + " - " + item.message;
												if (index < items.length-1) {
													str += "\n";
												}
											});
											options.message = str;
										}
									}
			
									var newEmailsCount;
									// because i use a max fetch the total unread email count might not be accurate - so if user is just signing in or startup then fetch the totalunread instead of the emails.length  
									if (Settings.read("accountAddingMethod") == "oauth" && (params.source == Source.SIGN_IN || params.source == Source.STARTUP)) {
										newEmailsCount = params.totalUnread;
									} else {
										newEmailsCount = params.emails.length;
									}
									options.title = getMessage("XNewEmails", [newEmailsCount]);
			
									let notificationParams = {
										options: options,
										buttonsWithValues: buttonsWithValues,
										newEmails: params.emails
									}
									openNotification(notificationParams).then(notificationId => {
										resolve();
									}).catch(error => {
										reject(error);
									});
								}
							} else {
								// notification are probably set to Off
								resolve("Notification settings are incorrect");
							}							
						} else {
							console.info("failed: passedDoNotShowNotificationIfGmailTabOpenTest");
						}
					});
				}
			}).catch(error => {
				reject(error);
			});
		} else {
			resolve("Notifications are probably disabled in the extension");
		}
	});
}

function openNotification(params) { // expected args: options, buttonsWithValues, newEmails
	return new Promise((resolve, reject) => {
		// remove previous notifications
		clearRichNotification(richNotifId).then(() => {
			// let's identify my notification with the mini icon IF we aren't already showing the extension logo in the notification iconurl
			if (DetectClient.isWindows() && params.options.iconUrl != Icons.NOTIFICATION_ICON_URL) {
				params.options.appIconMaskUrl = Icons.APP_ICON_MASK_URL;
			}
			if (DetectClient.isFirefox()) {
				params.options.priority = 2;
			} else {
				params.options.requireInteraction = true;
			}
			params.options.isClickable = true;
			
			var showNotificationDuration = Settings.read("showNotificationDuration");
			
			if (showNotificationDuration != "infinite") {
				setTimeout(() => {
					if (richNotifId) {
						console.log("timeout close notif");
						window.notificationClosedByDuration = true;
						clearRichNotification(richNotifId);
					}
				}, seconds(showNotificationDuration));
			}
		
			console.log("show notif", params.options, new Date());
			chrome.notifications.create("", params.options, notificationId => {
				if (chrome.runtime.lastError) {
					console.error("create error: " + chrome.runtime.lastError.message);
					if (!params.secondAttempt && chrome.runtime.lastError.message.indexOf("Unable to download all specified images") != -1) {
						params.options.iconUrl = Icons.NOTIFICATION_ICON_URL;
						params.secondAttempt = true;
						openNotification(params).then(notificationId => {
							resolve(notificationId);
						}).catch(error => {
							reject(error);
						});
					} else {
						reject(chrome.runtime.lastError.message);
					}
				} else {
					richNotifId = notificationId;
					richNotifMails = params.newEmails;
					richNotifButtonsWithValues = params.buttonsWithValues;
					resolve(notificationId);
				}
			});			
		});
	});
}

function getChromeWindowOrBackgroundMode() {
	return new Promise((resolve, reject) => {
		if (chrome.permissions && !DetectClient.isFirefox()) { // ff returns error when tring to detedt "background" permission
			chrome.permissions.contains({permissions: ["background"]}, function(result) {
				resolve(result);
			});
		} else {
			resolve(false);
		}
	}).then(result => {
		return new Promise((resolve, reject) => {
			if (result) {
				resolve();
			} else {
				chrome.windows.getAll(null, function(windows) {
					if (windows && windows.length) {
						resolve();
					} else {
						reject("No windows exist");
					}
				});
			}
		});
	});
}

function checkEmails(source) {
	return getChromeWindowOrBackgroundMode().then(function() {
		var intervalStopped = false;
		if (source == "wentOnline" || source == "wakeupFromSleep") {
			if (checkingEmails) {
				console.log("currently checking emails so bypass instant check");
				return Promise.resolve();
			} else {
				intervalStopped = true;
				console.log("check now for emails");
				// stop checking interval
				clearInterval(checkEmailTimer);
			}
		}
		
		checkingEmails = true;
		return getAllEmails({accounts:accounts}).then(allEmailsCallbackParams => {
			mailUpdate({showNotification:true, allEmailsCallbackParams:allEmailsCallbackParams});
			
			checkingEmails = false;

			if (intervalStopped) {
				// resume checking interval
				restartCheckEmailTimer();
			}
		});
	});
}

function startCheckEmailTimer() {
	var pollIntervalTime = calculatePollingInterval(accounts);
	
	if (pollIntervalTime == "realtime") {
		pollIntervalTime = minutes(5);
	} else {
		// make sure it's not a string or empty because it will equate to 0 and thus run all the time!!!
		// make sure it's not too small like 0 or smaller than 15 seconds
		if (isNaN(pollIntervalTime) || parseInt(pollIntervalTime) < seconds(15)) {
			pollIntervalTime = seconds(30);
		}
	}
	
	console.log("polling interval: " + (pollIntervalTime / ONE_SECOND) + "s");
	checkEmailTimer = setIntervalSafe(function() {
		checkEmails("interval");
	}, pollIntervalTime);
}

function restartCheckEmailTimer(immediately) {
	console.log("restarting check email timer")
	clearInterval(checkEmailTimer);
	
	// wait a little bit before restarting timer to let it's last execution run fully
	setTimeout(function() {
		startCheckEmailTimer();
	}, immediately ? 0 : seconds(30));
}

function shortcutNotApplicableAtThisTime(title) {
	var notif;
	var body = "Click here to remove this shortcut.";
	notif = new Notification(title, {body:body, icon:"/images/icons/icon_48.png"});
	notif.onclick = function() {
		openUrl("https://jasonsavard.com/wiki/Keyboard_shortcuts");
		this.close();
	}
}

// execute action on all mails
function executeAction(mails, actionName) {
	if (mails.length <= MAX_EMAILS_TO_ACTION) {
		var promises = [];
		
		$.each(mails, function(index, mail) {
			var promise = mail[actionName]({instantlyUpdatedCount:true});
			promises.push(promise);
		});
		
		Promise.all(promises).then(function() {
			if (actionName != "star" && actionName != "starAndArchive") {
				if (Settings.read("accountAddingMethod") == "oauth") {
					unreadCount = unreadCount-mails.length;
				}
				updateBadge(unreadCount);
			}
		}).catch(error => {
			var extensionConflictFlag = Settings.read("accountAddingMethod") == "autoDetect";
			showCouldNotCompleteActionNotification(error, extensionConflictFlag);
		});
	} else {
		showMessageNotification("Too many emails to " + actionName + " , please use the Gmail webpage!", error);
		mails.first().account.openInbox();
	}
}

function openInPopup(params) {
	var url = getPopupFile() + "?source=notification";
	
	params = initUndefinedObject(params);
	
	if (params.richNotifMails && params.richNotifMails.length == 1) {
		var mail = params.richNotifMails.first();
		url += "&previewMailId=" + mail.id;
	}

	params.width = Settings.read("popupWidth");
	params.height = Settings.read("popupHeight");
	params.url = url;
	params.openPopupWithChromeAPI = true;
	
	if (bg.popupWindow && bg.popupWindow.id) {
		chrome.windows.remove(bg.popupWindow.id, function() {
			if (chrome.runtime.lastError) {
				console.warn("close reminders: " + chrome.runtime.lastError.message);
			} else {
				bg.popupWindow = null;
			}
		});
	}
	
	var createWindowParams = getPopupWindowSpecs(params);
	chrome.windows.create(createWindowParams, newWindow => {
		bg.popupWindow = newWindow;
	});

	if (params.notificationId) {
		clearRichNotification(params.notificationId);
	}
}

function performButtonAction(params) {
	console.log("notificationButtonValue: " + params.notificationButtonValue);
	
	// actions...
	if (params.notificationButtonValue == "markAsRead") {
		executeAction(params.richNotifMails, "markAsRead");
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "delete") {
		executeAction(params.richNotifMails, "deleteEmail");
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "archive") {
		executeAction(params.richNotifMails, "archive");
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "spam") {
		executeAction(params.richNotifMails, "markAsSpam");
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "star") {
		executeAction(params.richNotifMails, "star");
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "starAndArchive") {
		executeAction(params.richNotifMails, "starAndArchive");
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "open" || params.notificationButtonValue == "openInNewTab") {
		
		var openParams = {};
		if (params.notificationButtonValue == "openInNewTab") {
			openParams.openInNewTab = true;
		}
		
		if (params.richNotifMails.length == 1) {
			params.richNotifMails.first().open(openParams);
		} else {
			params.richNotifMails.first().account.openInbox(openParams);
		}
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "openInPopup") {
		openInPopup(params);
	} else if (params.notificationButtonValue == "replyInPopup") {
		openInPopup(params);
	} else if (params.notificationButtonValue == "reply") {
		if (params.richNotifMails.length == 1) {
			params.richNotifMails.first().reply();
		} else {
			params.richNotifMails.first().account.openInbox();
		}
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "markDone") {
		executeAction(params.richNotifMails, "archive");
		clearRichNotification(params.notificationId);
	} else if (params.notificationButtonValue == "reducedDonationAd") {
		Settings.enable("reducedDonationAdClicked");
		openUrl("donate.html?ref=reducedDonationFromNotif");
		clearRichNotification(params.notificationId);
	} else {
		logError("action not found for notificationButtonValue: " + params.notificationButtonValue);
	}
	
	//sendGA("richNotification", params.notificationButtonValue);
}

function processOAuthUserResponse(tab, oAuthForMethod) {
	return new Promise(function(resolve, reject) {
		if (/success/i.test(tab.title)) {
			var code = tab.title.match(/code=(.*)/i);
			if (code) {
				code = code[1];
				chrome.tabs.remove(tab.id);
				
				oAuthForMethod.getAccessToken(code).then(function(accessTokenResponse) {
					resolve(accessTokenResponse);
				}).catch(function(error) {
					reject(error);
				});
			}
		} else if (/denied/i.test(tab.title)) {
			chrome.tabs.remove(tab.id);
			openUrl("https://jasonsavard.com/wiki/Granting_access?ref=permissionDenied&ext=gmail&state=" + encodeURIComponent(oAuthForMethod.getStateParam()) + "&title=" + encodeURIComponent(tab.title));
			reject("Denied");
		} else {
			var error = "Error getting code: " + tab.title;
			logError(error);
			reject(error);
		}
	});
}

function init() {

	try {
		if (!localStorage.detectedChromeVersion) {
			localStorage.detectedChromeVersion = true;
			DetectClient.getChromeChannel().then(result => {
				console.log("browser detection", result);
				if (result && result.channel != "stable") {
					var notification;
					var title = "You are not using the stable channel of Chrome";
					var body = "Click for more info. Bugs might occur, you can use this extension, however, for obvious reasons, these bugs and reviews will be ignored unless you can replicate them on stable channel of Chrome.";
					notification = new Notification(title, {body:body, icon:"/images/icons/icon_48.png"});
					notification.onclick = function () {
						openUrl("https://jasonsavard.com/wiki/Unstable_browser_channel");
						this.close();
					};
				}
			});
		}
	} catch (e) {
		logError("error detecting chrome version: " + e);
	}
	
	if (!chrome.runtime.onMessage || !window.Promise) {
		openUrl("https://jasonsavard.com/wiki/Old_Chrome_version");
		return;
	}

	chrome.browserAction.setBadgeBackgroundColor({color:[180, 180, 180, 255]});
	chrome.browserAction.setBadgeText({ text: "..." });
	chrome.browserAction.setTitle({ title: getMessage("loadingSettings") + "..." });
	buttonIcon = new ButtonIcon();

	var syncExcludeList = ["lastOptionStatsSent", "tabletViewUrl", "autoSave", "lastCheckedEmail", "customSounds", "widgetAccounts", "paypalInlineResponse", "contactsData", "peoplesData", "signedInGmailEmails", "tokenResponsesContacts"];
	syncOptions.init(syncExcludeList);
	
	settingsPromise.then(() => {
		var lang = Settings.read("language");
		return loadLocaleMessages(lang).then(() => {
			initCommon();
			
			// START LEGACY

			// END LAGACY
			
			oAuthForEmails = new OAuthForDevices({
				tokenResponses: Settings.read("tokenResponsesEmails"),
				scope: "https://www.googleapis.com/auth/gmail.modify"
			});
			oAuthForEmails.setOnTokenChange(function(params, allTokens) {
				console.log("bg setOnTokenChange", params, allTokens)
				Settings.store("tokenResponsesEmails", allTokens);
			});
			
			// Contacts
			oAuthForContacts = new OAuthForDevices({
				tokenResponses:Settings.read("tokenResponsesContacts"),
				scope:"https://www.google.com/m8/feeds",
				getUserEmail: function(tokenResponse, sendOAuthRequest) {
					return new Promise((resolve, reject) => {
						// were using the contacts url because it's the only one we request permission to and it will give us the email id (so only fetch 1 result)
						// send token response since we don't have the userEmail
						var sendParams = {
							tokenResponse: tokenResponse,
							url: "https://www.google.com/m8/feeds/contacts/default/thin" + CONTACTS_API_URL_PARAMS,
							appendAccessToken:true,
							header: CONTACTS_API_HEADER,
							data:{alt:"json", "max-results":"1"}
						};
						if (DetectClient.isChrome()) {
							sendParams.dataType = "jsonp";
						}
						sendOAuthRequest(sendParams).then(response => {
							//var data = JSON.parse(response.jqXHR.responseText);
							var data = response.data;
							response.userEmail = data.feed.id.$t;
							resolve(response);
						}).catch(error => {
							error = new Error("failed: you might by re-trying to fetch the userEmail for the non default account");
							error.warning = "failed: you might by re-trying to fetch the userEmail for the non default account";
							reject(error);
						});
					});
				}
			});
			oAuthForContacts.setOnTokenChange(function(params, allTokens) {
				if (params && params.tokenResponse) {
					Settings.store("tokenResponsesContacts", allTokens);
				}
			});

			// People (At the time it seems the API would only pull contacts that were added by the user) but I liked that the Contacts API could pull recently communicated with contacts so I decided to continue using the Conctacts API
			oAuthForPeople = new OAuthForDevices({
				tokenResponses:Settings.read("tokenResponsesPeople"),
				scope:"https://www.googleapis.com/auth/contacts.readonly",
				getUserEmail: function(tokenResponse, sendOAuthRequest) {
					return Promise.resolve({userEmail:emailAccountRequestingOauth});
				}
			});
			oAuthForPeople.setOnTokenChange(function(params, allTokens) {
				if (params && params.tokenResponse) {
					Settings.store("tokenResponsesPeople", allTokens);
				}
			});
			
			// Profile
			oAuthForProfiles = new OAuthForDevices({
				tokenResponses:Settings.read("tokenResponsesProfiles"),
				scope:"https://www.googleapis.com/auth/plus.me",
				getUserEmail: function(tokenResponse, sendOAuthRequest) {
					return Promise.resolve({userEmail:emailAccountRequestingOauth});
				}
			});
			oAuthForProfiles.setOnTokenChange(function(params, allTokens) {
				if (params && params.tokenResponse) {
					Settings.store("tokenResponsesProfiles", allTokens);
				}
			});

			chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
				if (message.command == "getMailUrl" && accounts != null && accounts.length > 0) {
					sendResponse({ mailUrl: accounts[0].getMailUrl(), openComposeReplyAction: Settings.read("openComposeReplyAction"), popupWindowSpecs:getPopupWindowSpecs() });
				} else if (message.command == "indexedDBSettingSaved") {
					syncOptions.storageChanged({key:message.key});
				} else if (message.command == "openTab") {
					openUrl(message.url);
				} else if (message.command == "openTabInBackground") {
					chrome.tabs.create({ url: message.url, active: false });
				} else if (message.command == "getVoiceInputSettings") {
					sendResponse({voiceInputSuggestions:Settings.read("voiceInputSuggestions"), voiceInputDialect:Settings.read("voiceInputDialect")});
				} else if (message.command == "findOrOpenGmailTab") {
					
					// must use this getaccountsbyemail because can't use message.account (because of onMessage transfer in json so function are lost from account object
					var account = getAccountByEmail(message.account.email);
					
					if (message.email) { // opening an email
						var foundEmail = false;
						var emails = account.getMail();						
						$.each(emails, function(emailIndex, email) {
							if (email.id == message.email.id) {
								foundEmail = true;
								var params = {};
								// used only if no matching tab found
								params.noMatchingTabFunction = function(url) {
									sendResponse({noMatchingTab:true, url:url})
								};
								email.open(params);
								return false;
							}
						});
						if (!foundEmail) {
							// then try opening inbox
							var params = {};
							// used only if no matching tab found
							params.noMatchingTabFunction = function(url) {
								sendResponse({noMatchingTab:true, url:url})
							};
							account.openInbox(params);
						}
					} else { // opening an inbox
						var params = {};
						// used only if no matching tab found
						params.noMatchingTabFunction = function(url) {
							sendResponse({noMatchingTab:true, url:url})
						};
						account.openInbox(params);
					}
					return true;
				} else if (message.command == "chromeTTS") {
					if (message.stop) {
						ChromeTTS.stop();
					} else {
						ChromeTTS.queue(message.text);
					}
				} else if (message.command == "getEmails") {
					var widgetAccounts = [];
					$.each(accounts, function(index, account) {
						var widgetAccount = {}
						
						widgetAccount.id = account.id;
						widgetAccount.email = account.getAddress();
						widgetAccount.unreadCount = account.getUnreadCount();
						
						var emails = account.getMail()
						var widgetEmails = [];
						$.each(emails, function(emailIndex, email) {
							var widgetEmail = {};
							widgetEmail.id = email.id;
							widgetEmail.title = email.title;
							widgetEmail.dateFormatted = email.issued.displayDate();
							widgetEmail.summary = email.summary;
							widgetEmail.name = email.getName();
							
							widgetEmails.push(widgetEmail);
						});
						widgetAccount.emails = widgetEmails;
						
						widgetAccounts.push(widgetAccount);
					});
					var widgetAccountsStringified = JSON.stringify(widgetAccounts);
					sendResponse(widgetAccountsStringified);
				}
			});
			
			if (chrome.contextMenus) {

				chrome.contextMenus.create({title: getMessage("openGmailTab"), contexts: ["browser_action"], onclick:function() {
					openGmail(accounts);
				}});

				chrome.contextMenus.create({title: getMessage("compose"), contexts: ["browser_action"], onclick:function() {
					getFirstActiveAccount(accounts).openCompose();
				}});

				chrome.contextMenus.create({title: getMessage("refresh"), contexts: ["browser_action"], onclick:function() {
					chrome.browserAction.setBadgeText({ text: "..." });
					refreshAccounts();
				}});

				try {
					window.markAllAsReadMenuId = chrome.contextMenus.create({title: getMessage("markAllAsRead"), contexts: ["browser_action"], visible: false, onclick:function() {
						accounts.forEach(account => {
							if (account.unreadCount >= 1) {
								if (account.unreadCount > MAX_EMAILS_TO_ACTION) {
									alert(getMessage("tooManyUnread", MAX_EMAILS_TO_ACTION));
								} else {
									markAllAsX(account, "markAsRead").then(() => {
										// do nothing
									}).catch(error => {
										alert(error);
									});
								}
							}
						});
					}});
				} catch (error) {
					console.warn("visible property might not be supported: " + error);
				}

				initQuickContactContextMenu();

				var doNotDisturbMenuId = chrome.contextMenus.create({title: getMessage("doNotDisturb"), contexts: ["browser_action"]});

				chrome.contextMenus.create({title: getMessage("turnOff"), contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					setDND_off();
				}});

				chrome.contextMenus.create({contexts: ["browser_action"], parentId:doNotDisturbMenuId, type:"separator"});

				chrome.contextMenus.create({title: getMessage("Xminutes", 30), contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					setDND_minutes(30);
				}});
				chrome.contextMenus.create({title: getMessage("Xhour", 1), contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					setDND_minutes(60);
				}});
				chrome.contextMenus.create({title: getMessage("Xhours", 2), contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					setDND_minutes(120);
				}});
				chrome.contextMenus.create({title: getMessage("Xhours", 4), contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					setDND_minutes(240);
				}});
				chrome.contextMenus.create({title: getMessage("today"), contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					setDND_today();
				}});
				chrome.contextMenus.create({title: getMessage("indefinitely"), contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					setDND_indefinitely();
				}});

				chrome.contextMenus.create({contexts: ["browser_action"], parentId:doNotDisturbMenuId, type:"separator"});

				chrome.contextMenus.create({title: getMessage("options") + "...", contexts: ["browser_action"], parentId:doNotDisturbMenuId, onclick:function() {
					openDNDOptions();
				}});
			}
				    
			if (chrome.alarms) {
				chrome.alarms.onAlarm.addListener(function(alarm) {
					if (alarm.name == "extensionUpdatedSync") {
						syncOptions.save("extensionUpdatedSync");
					} else if (alarm.name == "updateContacts") {
						if (Settings.read("showContactPhoto")) {
							// update contacts
							updateContacts().catch(function(error) {
								console.warn("updateContacts() error: " + error);
							});
						}
					} else if (alarm.name == "syncSignInOrder") {
						if (Settings.read("accountAddingMethod") == "oauth") {
							syncSignInOrderForAllAccounts().catch(error => {
								console.warn("syncSignInOrderForAllAccounts() error: " + error);
							});
						}
					} else if (alarm.name.startsWith(WATCH_EMAIL_ALARM_PREFIX)) {
						var email = alarm.name.split(WATCH_EMAIL_ALARM_PREFIX )[1];
						var account = getAccountByEmail(email);
						if (account) {
							account.watch();
						}
					} else if (alarm.name == "updateSkins") {
						console.log("updateSkins...");
						
						var skinsIds = [];
						var skinsSettings = Settings.read("skins");
						skinsSettings.forEach(function(skin) {
							skinsIds.push(skin.id);
						});
						
						if (skinsIds.length) {
							Controller.getSkins(skinsIds, Settings.read("_lastUpdateSkins")).then(skins => {
								console.log("skins:", skins);
								
								var foundSkins = false;
								skins.forEach(function(skin) {
									skinsSettings.some(function(skinSetting) {
										if (skinSetting.id == skin.id) {
											foundSkins = true;
											console.log("update skin: " + skin.id);
											copyObj(skin, skinSetting);
											//skinSetting.css = skin.css;
											//skinSetting.image = skin.image;
											return true;
										}
									});
								});
								
								if (foundSkins) {
									Settings.store("skins", skinsSettings);
								}
								
								Settings.storeDate("_lastUpdateSkins");
							});
						}
					} else if (alarm.name == "repeatNotification") {
						if (unreadCount >= 1) {
							if (Settings.read("repeatNotification")) {
								buttonIcon.startAnimation();
								if (Settings.read("notificationSound")) {
									playNotificationSound(soundSource);
								}
							}
						}
					} else if (alarm.name == "test") {
						localStorage.test = new Date();
					}
				});
			}
			
			if (chrome.idle.onStateChanged) {
				chrome.idle.onStateChanged.addListener(newState => {
					// returned from idle state
					console.log("onstatechange: " + newState + " " + now().toString());
					if (newState == "active") {
						ChromeTTS.stop();

						let MIN_SECONDS_BETWEEN_NOTIFICATIONS = 30;
						if (unreadCount >= 1 && !unreadEmailsChanged(lastShowNotifParams.emails) && (Math.abs(lastNotificationDate.diffInSeconds()) > MIN_SECONDS_BETWEEN_NOTIFICATIONS || detectSleepMode.isWakingFromSleepMode()) && lastNotificationDateWhileActive < lastNotificationDate && lastShowNotifParams.emails.first().account.lastSuccessfulMailUpdate > lastNotificationDate) {
							showNotification(lastShowNotifParams);
						}
					}
				});
			}
			
			// for adding mailto links (note: onUpdated loads twice once with status "loading" and then "complete"
			chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
				if (changeInfo.status == "loading") {
					
					var alreadyDetectedInbox = false;
					
					if (tab.url) {
						if (tab.url.indexOf(MAIL_DOMAIN + MAIL_PATH) == 0 || tab.url.indexOf(INBOX_BY_GMAIL_DOMAIN) == 0) {
							Settings.storeDate("lastCheckedEmail");

							if (accounts) {
							    $.each(accounts, function (i, account) {
									if (tab.url.indexOf(account.getMailUrl()) == 0) {
										console.log("Gmail webpage changed: " + tab.url);
										alreadyDetectedInbox = true;
										
										// only fetch emails if user is viewing an email ie. by detecting the email message id ... https://mail.google.com/mail/u/0/?shva=1#inbox/13f577bf07878472
										if (/\#.*\/[a-z0-9]{16}/.test(tab.url)) {
											account.getEmails().then(() => {
												mailUpdate();
											}).catch(error => {
												// nothing
											});
										}
										
										return false;
									}
							    })
							}
						}
						
						if (tab.url.indexOf(MAIL_DOMAIN + MAIL_PATH) == 0 && !alreadyDetectedInbox) {
							console.log("newly signed in")
							pollAccounts({noEllipsis:true, forceResyncAccounts:true, source:Source.SIGN_IN});
						}

						/* new order...
						 * 
						 * https://mail.google.com/mail/u/0/?logout&hl=en&hlor
						 * https://accounts.youtube.com/accounts/Logout2?hl=en&service=mail&ilo=1&ils=…s%3D1%26scc%3D1%26ltmpl%3Ddefault%26ltmplcache%3D2%26hl%3Den&zx=2053747305 
						 * http://www.google.ca/accounts/Logout2?hl=en&service=mail&ilo=1&ils=s.CA&ilc…%3D1%26scc%3D1%26ltmpl%3Ddefault%26ltmplcache%3D2%26hl%3Den&zx=-1690400221
						 * https://accounts.google.com/ServiceLogin?service=mail&passive=true&rm=false…=https://mail.google.com/mail/&ss=1&scc=1&ltmpl=default&ltmplcache=2&hl=en    
						 */
						if (/.*google\..*\/accounts\/Logout*/i.test(tab.url)) { //if (tab.url.indexOf("://www.google.com/accounts/Logout") != -1) {
							if (Settings.read("accountAddingMethod") == "autoDetect") {
								accounts = [];
								setSignedOut();
							} else if (Settings.read("accountAddingMethod") == "oauth") {
								// reset signed in emails
								//Settings.store("signedInGmailEmails");
								
								// reset account id
								accounts.forEach(function(account) {
									account.mustResync = true;
									account.resyncAttempts = 3;
								});
							}
						}
					}
				} else if (changeInfo.status == "complete") {

				}
			});
			
			/*
			// called for urls matching method=oauth to prevent the cookies from being sent to mail.google.com/mail/atom/...
			// ...because when doing an oauth send to mail.googl.com i could get the wrong email from mail.google.com/mail/atom/... even though i was request the authorization with a particular email
			// the interesting this is that i could fetch any email inbox simply by sending an oauth to mail.google/u/0.... ???
			chrome.webRequest.onBeforeSendHeaders.addListener(
				function (details) {
					console.log("onBeforeSendHeaders:", details);
					for (var i = 0; i < details.requestHeaders.length; ++i) {
						if (details.requestHeaders[i].name === 'Cookie') {
							details.requestHeaders.splice(i, 1);
						}
					}
					return {requestHeaders: details.requestHeaders};
				},
				// match all this...
				// feed/atom
				// feed/atom/
				// feed/atom/unread
				// feed/atom/unread?timestamp=123
				// feed/atom/unread?timestamp=123&method=oauth
				{urls: ["https://mail.google.com/mail/feed/atom*method=oauth*"]},
				["blocking", "requestHeaders"]
			);
			*/
			
			chrome.webRequest.onCompleted.addListener(
				function(details) {
					if (Settings.read("voiceInput")) {
						console.log("oncomplete webrequest:", details);
						
						if (details.url && details.url.indexOf("https://mail.google.com/mail/mu/") != -1) {
							// don't load speech for these
						} else {
							// added timeout because in compose popup window it seems the inserts were not working
							setTimeout(function() {
								insertSpeechRecognition(details.tabId);
							}, 200)
						}
					}
					
					if (Settings.read("playVideosInsideGmail")) {
						if (details.url && details.url.indexOf("https://mail.google.com/mail/mu/") != -1) {
							// don't load for these
						} else {
							// added timeout because in compose popup window it seems the inserts were not working
							setTimeout(function() {
								chrome.tabs.executeScript(details.tabId, {file:"/js/playVideos.js", allFrames:false});
							}, 200)
						}
					}
				},
				{types:["main_frame"], urls: ["*://mail.google.com/*"]}
			);

			if (chrome.tabs.onActivated) {
				chrome.tabs.onActivated.addListener(function(activeInfo) {
					chrome.tabs.get(activeInfo.tabId, function(tab) {
						if (chrome.runtime.lastError) {
							console.error(chrome.runtime.lastError.message);
						} else {
							if (tab && tab.url) {
								if (tab.url.indexOf(MAIL_DOMAIN) != -1 || tab.url.indexOf(INBOX_BY_GMAIL_DOMAIN) != -1) {
									if (notification) {
										notification.close();
									}
								}
							}
						}
					});
				});
			}
			
			if (chrome.storage) {
				chrome.storage.onChanged.addListener(function(changes, areaName) {
					console.log("storage changes " + new Date() + " : ", changes, areaName);
				});
			}
			
			if (chrome.commands && DetectClient.isChrome()) {
				chrome.commands.onCommand.addListener(function(command) {
					var errorFlag;
					var errorMsg;
					if (command == "markAsReadInNotificationWindow") {
						errorMsg = "Cannot mark email as read because there are no email notifications visible";
						if (Settings.read("desktopNotification") != "rich") {
							if (notification) {
								if (notification.mail) {
									// for when only one email ie. text or notify.html
									notification.mail.markAsRead();
									notification.close();
									
									if (Settings.read("accountAddingMethod") == "autoDetect") {
										if (unreadCount >= 1) {
											updateBadge(unreadCount-1);
										}
									}
								}
							} else {
								errorFlag = true;
							}
						} else {
							// rich notif
							if (richNotifId) {
								performButtonAction({notificationButtonValue:"markAsRead", notificationId:richNotifId, richNotifMails:richNotifMails});
							} else {
								errorFlag = true;
							}
						}
					} else if (command == "openEmailDisplayedInNotificationWindow") {
						errorMsg = "Cannot open email because there are no email notifications visible";
						if (Settings.read("desktopNotification") != "rich") {
							if (notification) {
								if (notification.mail) {
									// for when only one email ie. text or notify.html
									notification.mail.open();
									notification.close();
									
									if (Settings.read("accountAddingMethod") == "autoDetect") {
										if (unreadCount >= 1) {
											updateBadge(unreadCount-1);
										}
									}
								}
							} else {
								errorFlag = true;
							}
						} else {
							// rich notif
							if (richNotifId) {
								performButtonAction({notificationButtonValue:"open", notificationId:richNotifId, richNotifMails:richNotifMails});
							} else {
								errorFlag = true;
							}
						}
					} else if (command == "compose") {
						getFirstActiveAccount(accounts).openCompose();
					} else if (command == "quickComposeEmail") {
						openQuickCompose();
					}
					
					if (errorFlag) {
						shortcutNotApplicableAtThisTime(errorMsg);
					}
					
				});
			}

			unreadCount = 0;
			buttonIcon.setIcon({signedOut:true});
			initPopup(unreadCount);

			// call poll accounts initially then set it as interval below
			pollAccounts({showNotification:true, source:Source.STARTUP, refresh:true}).then(() => {
				// set check email interval here
				startCheckEmailTimer();
			}).catch(error => {
				showMessageNotification("Problem starting extension", "Try re-installing the extension.", error);
			});

			if (Settings.read("accountAddingMethod") == "autoDetect") {

				// check every 10 seconds or if not signed in to any accounts
				setIntervalSafe(function() {
					if (accounts.length == 0) {
						pollAccounts({showNotification:true});
					}
				}, seconds(10));

				// patch: make sure there are no duplicate accounts that could create lockout issue
				setIntervalSafe(function() {
					var uniqueAccounts = [];
					
					var foundDuplicateAccount;
					// start from end so that we remove duplicates from the end, assuming the first ones in the array in their correct position
					for (var a=accounts.length-1; a>=0; a--) {
						for (var b=a-1; b>=0; b--) {
							if ($.trim(accounts[a].getAddress()) == $.trim(accounts[b].getAddress())) {
								console.warn("dupe detection interval: remove ", accounts[a].getAddress());
								foundDuplicateAccount = true;
								break;
                            }
						}
						if (foundDuplicateAccount) {
                            foundDuplicateAccount = false;
                        } else {
							uniqueAccounts.unshift(accounts[a]);                            
                        }
					}
					accounts = uniqueAccounts;
				}, seconds(75));
			}
			
			// if iselibigable for reduced donations than make sure user hasn't contributed before, if so do not display this eligable notice
			setIntervalSafe(function() {
				if (!Settings.read("donationClicked") && !Settings.read("verifyPaymentRequestSentForReducedDonation") && accounts.length) {

					// check sometime within 7 days (important *** reduce the load on my host)
					if (passedRandomTime("randomTimeForVerifyPayment", 7)) {
						verifyPayment(accounts).then(response => {
							if (response.unlocked) {
								Controller.processFeatures();
							}
						});
						Settings.enable("verifyPaymentRequestSentForReducedDonation");
					}
				}
			}, minutes(5));

			// do this every day so that the daysellapsed is updated in the uninstall url
			setIntervalSafe(function() {
				setUninstallUrl(getFirstActiveEmail(accounts));
			}, days(1));

			// for detecting and update the DND status to the user
			setIntervalSafe(function() {
				updateBadge();
			}, minutes(1));

			$(window).on("offline online", function(e) {
				console.log("detected: " + e.type + " " + new Date());
				if (e.type == "online") {
					console.log("navigator: " + navigator.onLine + " " + new Date());
					setTimeout(function() {
						if (getAccountsSummary(accounts).signedIntoAccounts == 0) {
							console.log("navigator: " + navigator.onLine);
							checkEmails("wentOnline");
						}
					}, seconds(3))
				}
			});


			// collect stats on options
			if (daysElapsedSinceFirstInstalled() > 14 && (!Settings.read("lastOptionStatsSent") || Settings.read("lastOptionStatsSent").daysInThePast() >= 7)) { // start after 2 weeks to give people time to decide and then "every" 7 days after that (to keep up with changes over time)
				console.log("collecting optstats soon...")
				setTimeout(function() { // only send after a timeout make sure ga stats loaded
					console.log("collecting optionstats")
					
					var optionStatCounter = 1;
					
					function sendOptionStat(settingName) {
						var settingValue = Settings.read(settingName);
						
						// Convert booleans to string because google analytics doesn't process them
						if (settingValue === true) {
							settingValue = "true";
						} else if (settingValue === false || settingValue == null) {
							settingValue = "false";
						}
						
						// issue: seems like the 1st 10 are being logged only in Google Analytics - migth be too many sent at same time
						// so let's space out the sending to every 2 seconds
						setTimeout(function() {
							sendGA("optionStats", settingName, settingValue);
						}, optionStatCounter++ * seconds(2));
					}
					
					if (accounts.length >= 1) {
						//sendGA("optionStats", "totalAccounts", accounts.length + " accounts", accounts.length);
					}
					
					//sendOptionStat("browserButtonAction");
					//sendOptionStat("checkerPlusBrowserButtonActionIfNoEmail");
					//sendOptionStat("gmailPopupBrowserButtonActionIfNoEmail");
					//sendOptionStat("desktopNotification");
					//sendOptionStat("notificationSound");
					//sendOptionStat("notificationVoice");
					//sendOptionStat("accountAddingMethod");
					//sendOptionStat("donationClicked");
					//sendOptionStat("extensionUpdates");
					//sendOptionStat("icon_set");
					//sendOptionStat("showContactPhoto");
					//sendOptionStat("showNotificationEmailImagePreview");
					//sendOptionStat("showfull_read");
					
					Settings.storeDate("lastOptionStatsSent");
					
				}, minutes(2));
			}
			
			//console.time("DateTimeHighlighter");
			DateTimeHighlighter();
			//console.timeEnd("DateTimeHighlighter");
		});
	}).catch(error => {
		logError("starting extension: " + error, error);
		showMessageNotification("Problem starting extension", "Try re-installing the extension.", error);
	});
	
	$(window).on("storage", function(e) {
		syncOptions.storageChanged({key:e.originalEvent.key});
	});
	
}

function hasDuplicatedAccount(account) {
	// if duplicate email found then let's stop before it repeats
	for (var a=0; a<accounts.length; a++) {
		if (account.getAddress() == accounts[a].getAddress()) {
			console.info("duplicate account " + account.getAddress() + " found so stop finding accounts, total: " + accounts.length);
			return true;
		} else {
			console.info("valid account: " + a + " [" + account.getAddress() + "] (" + account.link + ") AND [" + accounts[a].getAddress() + "] (" + accounts[a].link + ")");
		}
	}
	
	for (var a=0; a<ignoredAccounts.length; a++) {
		if (ignoredAccounts[a].getAddress() == account.getAddress()) {
			console.info("duplicate 'ignored' account " + account.getAddress() + " found so stop finding accounts, total: " + accounts.length);
			return true;
		}
	}
}

function initMailAccount(params) {
	return new Promise((resolve, reject) => {
		var MAX_ACCOUNTS = 20;
		
	    buttonIcon.stopAnimation();
	    
	    var tokenResponse = oAuthForEmails.findTokenResponseByIndex(params.accountNumber);
	    var mailAddress;
	    if (tokenResponse && tokenResponse.userEmail) {
	    	mailAddress = tokenResponse.userEmail;
	    }
	    
	    // when using auto-detect use the accountnumber and eventually the mailaddress will get populated with the fetch
	    // when using oauth use the mailaddress passed in here to fetch the appropriate data
	    var account = new MailAccount({accountNumber:params.accountNumber, mailAddress:mailAddress});
	    var safeAmountOfAccountsDetected = params.accountNumber <= MAX_ACCOUNTS && isOnline();
	    var continueToNextAccount;
	    var deleteAccount;
	    
	    account.fetchGmailSettings(params).then(() => {
	    	// do nothing continue to next then below
	    }).catch(error => {
			if (!DetectClient.isFirefox()) {
	    		console.error("Error fetching Gmail settings: " + error);
			}
	    }).then(() => {
		    account.getEmails().then(() => {
				console.info("Detected account: " + account.getAddress());
		
		    	// maximum accounts, if over this we might be offline and just gettings errors for each account
		    	if (safeAmountOfAccountsDetected) {
		    		if (hasDuplicatedAccount(account)) {
		    			deleteAccount = true;
		    		} else {
			    		// cbParams.ignored was the old way of putting ignore email in a free textarea, getSettings("ignore") is new way of checking it on/off in per email settings
			    		if (account.getSetting("ignore")) {
			    			// do not add, ignore this one and try next
			    			console.info("initMailAccount - ignored");
			    			ignoredAccounts.push(account);
			    		} else {
			    			// success
							console.info("Adding account: " + account.getAddress());
			    			accounts.push(account);
			    		}
			    		continueToNextAccount = true;	    			
		    		}
		    	} else {
					if (isOnline()) {
						logError("jmax accounts reached");
					} else {
						console.warn("Not online so not detecting accounts");
					}
		    	}
		    }).catch(error => {
		    	if (safeAmountOfAccountsDetected) {
		    		if (hasDuplicatedAccount(account)) {
		    			deleteAccount = true;
		    		} else {
						// test for error.toLowerCase because error could be an Error object (which doesn't have a .toLowerCase)
						if (error && (new String(error).toLowerCase() == "unauthorized" || (error.jqXHR && error.jqXHR.status == 401))) { // not signed in
							console.log("Unauthorized");
							unauthorizedAccounts++;
							deleteAccount = true;
							// if offline then watch out because all accounts will return error, but not unauthorized, so must stop from looping too far
							// if too many unauthorized results than assume they are all signed out and exit loop, else continue looping
							var maxUnauthorizedAccount = parseInt(Settings.read("maxUnauthorizedAccount"));
							if (unauthorizedAccounts < maxUnauthorizedAccount) {
								continueToNextAccount = true;
							}
						} else if (error.errorCode == JError.GOOGLE_ACCOUNT_WITHOUT_GMAIL || error.errorCode == JError.GMAIL_NOT_ENABLED || error.errorCode == JError.GOOGLE_SERVICE_ACCOUNT) {
							console.log("Recognized error: " + error.errorCode);
							accounts.push(account);
							continueToNextAccount = true;
						} else if (accounts.length && accounts.last().error) {
							// if consecutive accounts with errors let's quit - trying to avoid the locked account condition
							console.error("Consecutive accounts with errors so not looking for anymore");
							//accounts.push(account);
							deleteAccount = true;
						} else if (account.hasBeenIdentified()) {
							console.info("Adding error account: " + account.getAddress(), error);
							account.error = error;
			    			accounts.push(account);
			    			continueToNextAccount = true;
						} else {
							// timeout checking 2nd account on Chrome startup: happened on ME's Mac causing unread count issue because that 2nd account was set to be ignored
							console.info("Error account: " + account.getAddress(), error);
							deleteAccount = true;
							continueToNextAccount = true;
						}
		    		}
		    	} else {
		    		// Error on last one most probably they were all errors ie. timeouts or no internet so reset all accounts to 0
		    		accounts = [];
		    		console.info("mailaccount - probably they were all errors");
		    	}
		    }).then(() => {
		    	if (deleteAccount) {
					account = null;
					delete account;
		    	}
		    	
		    	if (continueToNextAccount) {
		    		params.accountNumber++;
		    		initMailAccount(params).then(() => {
		    			resolve();	
		    		}).catch(error => {
		    			reject(error);
		    		});
		    	} else {
		    		resolve();
		    	}
		    });
	    });
	});
}

function pollAccounts(params) {
	return new Promise((resolve, reject) => {
		params = initUndefinedObject(params);

		if (pollingAccounts && !params.refresh) {
			console.log("currently polling: quit polling me!")
			resolve();
		} else {
			new Promise((resolve, reject) => {
				console.log("poll accounts...");
				
				pollingAccounts = true;
				
				if (!params.noEllipsis) { 
					chrome.browserAction.setBadgeText({ text: "..." });
				}	
				chrome.browserAction.setTitle({ title: getMessage("pollingAccounts") + "..." });
	
				resolve();
			}).then(() => {
				if (Settings.read("accountAddingMethod") == "autoDetect") {
					if (accounts != null) {
						$.each(accounts, function (i, account) {
							account = null;
							delete account;
						});
					}
					
					accounts = [];
					ignoredAccounts = [];
					unauthorizedAccounts = 0; 
					
					params.accountNumber = 0;
					return initMailAccount(params);
				} else { // manual adding
					return new Promise((resolve, reject) => {
						if (params.refresh) {
							alwaysPromise(initOauthAccounts()).then(() => {
								resolve();
							});
						} else {
							resolve();
						}
					}).then(() => {
						return getAllEmails({accounts:accounts, refresh:true});
					});
				}
			}).then(() => {
				var accountsSummary = getAccountsSummary(accounts);
				
				if (accountsSummary.signedIntoAccounts == 0) {
					setSignedOut({title:accountsSummary.firstNiceError});
				} else {
					// see if i should unlock this user...
					if (!Settings.read("verifyPaymentRequestSent")) {
						verifyPayment(accounts).then(response => {
							if (response.unlocked) {
								Controller.processFeatures();
							}
						});
						Settings.enable("verifyPaymentRequestSent");
					}
					mailUpdate(params);
				}
				
				//unreadCountWhenShowNotificationWhileActive = unreadCount;
			}).catch(error => {
				reject(error);
			}).then(() => {
				pollingAccounts = false;
				resolve();
			});
		}
	});
}

function getSettingValueForLabels(account, settings, labels, defaultObj) {
	if (!settings) {
		settings = {};
	}

	var customLabel;
	var systemLabel;

	if (labels) {
		for (var a=labels.length-1; a>=0; a--) {
			var label = labels[a];
			var labelId = getJSystemLabelId(label);
			settingValue = settings[labelId];
			if (typeof settingValue != "undefined" && account.hasMonitoredLabel(labelId)) {
				// if system label then save it but keep looking for custom label first!
				if (isSystemLabel(label)) {
					systemLabel = settingValue;
				} else {
					customLabel = settingValue;
					break;
				}
			}
		}
	}
	
	// test for undefined because we could have "" which means Off
	if (customLabel != undefined) {
		return customLabel;
	} else if (systemLabel != undefined) {
		return systemLabel;
	} else {
		return defaultObj;
	}
}

// Called when an account has received a mail update
function mailUpdate(params) {
	params = initUndefinedObject(params);
	
	buttonIcon.stopAnimation();
	
	updateNotificationTray();

	// if this mailUpdate is called from interval then let's gather newest emails ELSE we might gather later in the code
	var newEmails = [];
	if (params.allEmailsCallbackParams) {
		$.each(params.allEmailsCallbackParams, function(index, allEmailsCallback) {
			if (allEmailsCallback.newestMailArray && allEmailsCallback.newestMailArray.length) {
				console.log("allEmailsCallback.newestMailArray:", allEmailsCallback.newestMailArray);
				newEmails = newEmails.concat(allEmailsCallback.newestMailArray);
			}
		});
	}

	var totalUnread = 0;
	var lastMailUpdateAccountWithNewestMail;
	var someAccountsHaveErrors = false;
	
	$.each(accounts, function(i, account) {
		if (account.error) {
			someAccountsHaveErrors = true;
		} else {
			if (account.getUnreadCount() > 0) {
				totalUnread += account.getUnreadCount();
			}
			account.lastSuccessfulMailUpdate = new Date();
		}

		if (account.getNewestMail()) {
			if (!lastMailUpdateAccountWithNewestMail || !lastMailUpdateAccountWithNewestMail.getNewestMail() || account.getNewestMail().issued > lastMailUpdateAccountWithNewestMail.getNewestMail().issued) {
				lastMailUpdateAccountWithNewestMail = account;
			}

			if (!params.allEmailsCallbackParams) {
				newEmails = newEmails.concat(account.getAllNewestMail());
			}
		}
	});
	
	if (!params.instantlyUpdatedCount) {
		updateBadge(totalUnread);
	}
	
	newEmails.sort(function (a, b) {
	   if (a.issued > b.issued)
		   return -1;
	   if (a.issued < b.issued)
		   return 1;
	   return 0;
	});
	
	if (newEmails.length) {
		var mostRecentNewEmail = newEmails.first();
		accountWithNewestMail = mostRecentNewEmail.account;
		
		var passedDateCheck = false;
		if (Settings.read("showNotificationsForOlderDateEmails")) {
			if (accountWithNewestMail.getMail().length < 20) {
				passedDateCheck = true;
			} else {
				console.warn("more than 20 emails so bypassing check for older dated emails");
				if (mostRecentNewEmail.issued > lastNotificationAccountDates[accountWithNewestMail.id]) {
					passedDateCheck = true;
				}
			}
		} else {
			if (mostRecentNewEmail.issued > lastNotificationAccountDates[accountWithNewestMail.id]) {
				passedDateCheck = true;
			}
		}
		
		if (!lastNotificationAccountDates[accountWithNewestMail.id] || passedDateCheck) {
			
			lastNotificationAccountDates[accountWithNewestMail.id] = mostRecentNewEmail.issued;

			// new
			var newestMailObj = Settings.read("_newestMail");
			if (newestMailObj[accountWithNewestMail.getAddress()] != mostRecentNewEmail.id) {
				
				getDNDState().then(function(dndState) {
					if (!dndState) {
						buttonIcon.startAnimation();
					}
				});

				soundSource = getSettingValueForLabels(accountWithNewestMail, accountWithNewestMail.getSetting("sounds"), mostRecentNewEmail.labels, Settings.read("notificationSound"));

				// show notification, then play sound, then play voice
				if (params.showNotification) {
					// save them here for the next time i call showNotification when returning from idle
					params.totalUnread = totalUnread;
					params.emails = newEmails;
					lastShowNotifParams = params;
					showNotification(params)
						.catch(error => {
							// do nothing but must catch it to continue to next then
							console.error("show notif error", error);
						})
						.then(() => {
							if (Settings.read("notificationSound")) {
								playNotificationSound(soundSource).then(() => {
									playVoiceNotification(accountWithNewestMail);
								});
							} else {
								playVoiceNotification(accountWithNewestMail);
							}
						})
					;
				} else if (Settings.read("notificationSound")) {
					playNotificationSound(soundSource).then(() => {
						playVoiceNotification(accountWithNewestMail);
					});
				} else {
					playVoiceNotification(accountWithNewestMail);
				}
				
				newestMailObj[accountWithNewestMail.getAddress()] = mostRecentNewEmail.id;
				Settings.store("_newestMail", newestMailObj);

				if (Settings.read("repeatNotification")) {
					chrome.alarms.create("repeatNotification", {periodInMinutes:1});
				}
			}
		}
	}
	
	unreadCount = totalUnread;
	initPopup(unreadCount);
	
	// update the uninstall url caused we detected an email
	var firstActiveEmail = getFirstActiveEmail(accounts);
	if (uninstallEmail != firstActiveEmail) {
		setUninstallUrl(firstActiveEmail);
	}
}

// if any of the mails do not exist anymore than assume one has been read/deleted
function unreadEmailsChanged(mails) {
	if (mails) {
		var allUnreadMail = getAllUnreadMail(accounts);
		var mailsStillUnreadCount = 0;
		for (var a = 0; a < mails.length; a++) {
			for (var b = 0; b < allUnreadMail.length; b++) {
				if (mails[a] && allUnreadMail[b] && mails[a].id == allUnreadMail[b].id) {
					mailsStillUnreadCount++;
				}
			}
		}
		return mails.length != mailsStillUnreadCount;
	}
}

function updateNotificationTray() {
	if (unreadEmailsChanged(richNotifMails)) {
		clearRichNotification(richNotifId);
	}
}

function setSignedOut(params) {
	console.log("setSignedOut");
	params = initUndefinedObject(params);
	
	bg.buttonIcon.setIcon({signedOut:true});
	chrome.browserAction.setBadgeBackgroundColor({color:[180, 180, 180, 255]});
	chrome.browserAction.setBadgeText({ text: "X" });
	if (params.title) {
		chrome.browserAction.setTitle({ title: String(params.title) });
	} else {
		chrome.browserAction.setTitle({ title: getMessage("notSignedIn") });
	}
	if (Settings.read("accountAddingMethod") == "autoDetect") {
		unreadCount = 0;
	}
}

function playNotificationSound(source) {
	return new Promise((resolve, reject) => {
		if (!notificationAudio) {
			notificationAudio = new Audio();
		}

		var audioEventTriggered = false;
		
		getDNDState().then(dndState => {
			if (dndState || source == "") {
				resolve();
			} else {

				if (!source) {
					source = Settings.read("notificationSound");
				}

				var changedSrc = lastNotificationAudioSource != source;
				
				// patch for ogg might be crashing extension
				// patch linux refer to mykhi@mykhi.org
				if (DetectClient.isLinux() || changedSrc) {
					if (source.indexOf("custom_") == 0) {
						var sounds = Settings.read("customSounds");
						if (sounds) {
							// custom file selectd
							$.each(sounds, function(index, sound) {
								if (source.replace("custom_", "") == sound.name) {
									console.log("loadin audio src")
									notificationAudio.src = sound.data;
								}
							});
						}					
					} else {
						console.log("loadin audio src")
						notificationAudio.src = SOUNDS_FOLDER + source;
					}
			   }
			   lastNotificationAudioSource = source;
			   
			   $(notificationAudio).off().on("ended abort error", function(e) {
				   console.log(e.type);
				   // e.target.error.code
				   // ignore the abort event when we change the .src
				   if (!(changedSrc && e.type == "abort") && !audioEventTriggered) {
					   audioEventTriggered = true;
					   resolve();
				   }
			   });
			   
			   notificationAudio.volume = Settings.read("notificationSoundVolume") / 100;
			   notificationAudio.play();
			}
		}).catch(error => {
			resolve();
		});
	});
}

function getVoiceMessageAttachment(mail) {
	var found;
	var promise;
	
	var lastMessage = mail.messages.last();
	
	var hasVoiceMessageAttachment;
	if (lastMessage.files && lastMessage.files.length && lastMessage.files[0].filename.indexOf(VOICE_MESSAGE_FILENAME_PREFIX + ".") != -1) {
		hasVoiceMessageAttachment = true;
	}
	
	if ((mail.authorMail && mail.authorMail.indexOf("vonage.") != -1) || (lastMessage.content && lastMessage.content.indexOf(VOICE_MESSAGE_FILENAME_PREFIX + ".") != -1) || hasVoiceMessageAttachment) {
		if (Settings.read("accountAddingMethod") == "autoDetect") {
			var $attachmentNodes = parseHtmlToJQuery(lastMessage.content).find(".att > tbody > tr");
			if ($attachmentNodes.length) {
				var $soundImage = $attachmentNodes.first().find("imghidden[src*='sound']");
				if ($soundImage.length) {
					fixRelativeLinks($attachmentNodes, mail);
					var soundSrc = $soundImage.parent().attr("href");
					// make sure it's from the google or we might be picking up random links that made it all the way to this logic
					if (soundSrc && soundSrc.indexOf("google.com") != -1) {
						found = true;
						// just returns the souce src;
						promise = Promise.resolve(soundSrc);
					}
				}
			}
		} else {
			if (lastMessage.files && lastMessage.files.length) {
				var file = lastMessage.files.first();
				if (file.mimeType && file.mimeType.indexOf("audio/") != -1) {
					found = true;
					promise = new Promise(function(resolve, reject) {
						// create sub promise to return a concatenated sound src to play in audio object ie. data: + mimetype + response.data
						mail.account.fetchAttachment({messageId:lastMessage.id, attachmentId:file.body.attachmentId, size:file.body.size}).then(function(response) {
							resolve("data:" + file.mimeType + ";base64," + response.data);
						}).catch(function(error) {
							reject(error);
						});
					});
				}
			}
		}
	}
	
	return {found:found, promise:promise}
}

function playVoiceNotification(accountWithNewestMail) {
	console.log("playVoiceNotification");
	
	// watch out 2 mute voice types...
	
	// this one is for temporarly muting voice from icon in the popup window
	// this one is for muting voice between certain hours set in the options
	
	function queueVoice() {
		var newestEmail = accountWithNewestMail.getNewestMail();

		// put a bit of time between chime and voice
		setTimeout(function() {
			if (newestEmail) {
				
				var voiceHear = getSettingValueForLabels(accountWithNewestMail, accountWithNewestMail.getSetting("voices"), newestEmail.labels, Settings.read("voiceHear"));

				if (voiceHear) {
					
					var hearFrom = voiceHear.indexOf("from") != -1;
					var hearSubject = voiceHear.indexOf("subject") != -1;
					var hearMessage = voiceHear.indexOf("message") != -1;
					
					var fromName = generateNotificationDisplayName(newestEmail);
					
					// filter for speech
					
					if (newestEmail.authorMail && newestEmail.authorMail.indexOf("vonage.") != -1) {
						// put vonage instead because or elee the phone number is spoken like a long number ie. 15141231212 etc...
						fromName = "Vonage";
					}

					var subject = newestEmail.title;
					subject = cleanEmailSubject(subject);

					var introToSay = "";
					var messageToSay = "";
					
					var voiceMessageAttachmentObj = getVoiceMessageAttachment(newestEmail);
					
					if (hearFrom) {
						if (hearSubject || hearMessage) {
							// from plus something else...
							introToSay = getMessage("NAME_says", fromName);
						} else {
							// only from
							introToSay = getMessage("emailFrom_NAME", fromName);
						}
					} 
						
					if ((hearSubject || hearMessage) && !voiceMessageAttachmentObj.found) {
						if (hearSubject && !subjects[subject] && !/no subject/i.test(subject) && !/sent you a message/i.test(subject)) {
							subjects[subject] = "ALREADY_SAID";
							messageToSay += subject.htmlToText();
						} else {
							console.log("omit saying the subject line")
						}
						
						if (hearMessage) {
							var spokenWordsLimit = Settings.read("spokenWordsLimit");
							var spokenWordsLimitLength;
							if (spokenWordsLimit == "summary") {
								spokenWordsLimitLength = 101;
							} else if (spokenWordsLimit == "paragraph") {
								spokenWordsLimitLength = 500;
							} else {
								spokenWordsLimitLength = 30000;
							}
							
							var messageText = newestEmail.getLastMessageText({maxSummaryLetters:spokenWordsLimitLength, htmlToText:true});
							if (messageText) {
								messageToSay += ", " + messageText;
							}
						}
					}
					
					console.log("message to say: " + introToSay + " " + messageToSay);
					if (introToSay) {
						ChromeTTS.queue(introToSay, {noPause:true, forceLang:Settings.read("language")});
					}
					if (messageToSay) {
						ChromeTTS.queue(messageToSay).then(() => {
							if (hearMessage && voiceMessageAttachmentObj.found) {
								voiceMessageAttachmentObj.promise.then(response => {
									voiceMessageAudio = new Audio();
									voiceMessageAudio.src = response;
									voiceMessageAudio.volume = Settings.read("voiceSoundVolume") / 100;
									voiceMessageAudio.play();
								}).catch(error => {
									console.error("error getVoiceMessageAttachment: " + error);
								});
							}
						});						
					}
				} else {
					console.log("voiceHear off for these labels");
				}
			} else {
				console.warn("in playVoiceNotification this returns null?? -> accountWithNewestMail.getNewestMail()");
			}
		}, 1000);
	}
	
	if (Settings.read("notificationVoice")) {
		getDNDState().then(dndState => {
			if (!dndState) {
				if (Settings.read("voiceNotificationOnlyIfIdleInterval")) {
					chrome.idle.queryState(parseInt(Settings.read("voiceNotificationOnlyIfIdleInterval")), state => {
						// apparently it's state can be locked or idle
						if (state != "active" && !detectSleepMode.isWakingFromSleepMode()) {
							queueVoice();
						}
					});
				} else {
					queueVoice();
				}
			}
		}).catch(response => {
			// nothing, maybe callback() if neccessary
		});
	}
}

function preloadProfilePhotos(mails, callback) {
	var timeoutReached = false;
	if (Settings.read("showContactPhoto")) {
		
		// gather unique emails
		var userEmails = mails.uniqueAttr(mail => {
			return mail.account.getAddress();
		});
		
		var uniqueAccounts = userEmails.filter(userEmail => {
			getAccountByEmail(userEmail);
		});
		
		// let's ensure all tokens first before looping
		ensureContactsWrapper(uniqueAccounts).then(function() {
			var deferreds = new Array();
			$.each(mails, function(index, mail) {
		
			   var dfd = $.Deferred();
			   deferreds.push(dfd);
				
			   var contactPhoto = new Image();
			   getContactPhoto({mail:mail}, function(params) {
					if (params.error) {
						console.log("contacterror: " + params.error, params);
						dfd.resolve(params);
					} else {
						console.log("photoUrl: " + params.photoUrl);
						
						if (params.photoUrl) {
							$(contactPhoto).attr("src", params.photoUrl);
							
							loadImage($(contactPhoto)).then(() => {
								mail.contactPhoto = contactPhoto;
								dfd.resolve("success");
							}).catch(e => {
								var error = "could not load image2: " + params.photoUrl + " " + e;
								console.log(error);
								dfd.resolve({error:error});
							});
							
						} else {
							dfd.resolve("success");
						}
					}
				});
			   
			   	dfd.promise();
			});
		
			// wait for https images to load because even if the deferreds completed it seem the contact images woulnd't load at extension startup
			var preloadTimeout = setTimeout(function() {
				timeoutReached = true;
				console.log("preloadphotos timeoutEND");
				callback();
			}, seconds(3));
			
			$.when.apply($, deferreds).always(function() {
				console.log("preloadphotos always args", arguments);
				// cancel timeout
				clearTimeout(preloadTimeout);
				// make sure timeout did not already call the callback before proceeding (don't want to call it twice)
				if (!timeoutReached) {
					console.log("preloadphotos whenEND");
					callback();
				}
			});
		}).catch(function(error) {
			callback({error:error});
		});
	} else {
		callback();
	}
}

function markAllAsX(account, action, closeWindow) {
	return new Promise((resolve, reject) => {
		var promises = [];
		var delay = 0;
		var totalUnreadMails = getAllUnreadMail(accounts).length;
		var totalMailsInThisAccount = account.getMail().length;
		
		account.getMail().forEach(function(mail, index) {
			if (index+1 <= MAX_EMAILS_TO_ACTION) {
				var promise = new Promise((resolve, reject) => {
					setTimeout(function() {
						var markAsPromise;
						if (action == "markAsDone") {
							markAsPromise = mail.archive({instantlyUpdatedCount:true});
						} else if (action == "markAsRead") {
							markAsPromise = mail.markAsRead({instantlyUpdatedCount:true});
						}
					
						markAsPromise.then(() => {
							resolve();
						}).catch(response => {
							reject(response);
						});
						
					}, delay);
					
					if (totalMailsInThisAccount > MAX_EMAILS_TO_INSTANTLY_ACTION) {
						delay += 300;
					}
				});
				
				promises.push(promise);
				
			} else {
				return false;
			}
		});
		
		var totalMarkedAsX = promises.length;
		
		// simulate speed by quickly resetting the badge and close the window - but processing still take place below in .apply
		if (totalUnreadMails - totalMarkedAsX == 0) {
			updateBadge(0);
			if (closeWindow) {
				closeWindow({source:"markAll:" + action});
			}
		}
		
		Promise.all(promises).then(promiseAllResponse => {
			resolve();
		}).catch(error => {
			reject(error);
		});
	});
}
