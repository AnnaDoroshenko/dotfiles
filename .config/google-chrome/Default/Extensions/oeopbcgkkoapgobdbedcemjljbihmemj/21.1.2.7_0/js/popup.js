var inWidget = location.href.indexOf("source=widget") != -1;
var autoSaveInterval;
var replyingToMail;
var currentTabletFrameEmail;
var mouseInPopup = false;
var mouseHasEnteredPopupAtleastOnce = false;
var POPUP_VIEW_TABLET = "tabletView";
var POPUP_VIEW_CHECKER_PLUS = "checkerPlus";
var popupView;
var inWidget;
var fromToolbar;
var isDetached;
var isTemporaryPopup;
var renderAccountsInterval;
var windowOpenTime = new Date();
var initOpenEmailEventListenersLoaded;
var hiddenMails = [];
var drawerIsVisible;
var skinsSettings;
var closeWindowTimeout;

var MAX_POPUP_HEIGHT = 600;
var HEADER_HEIGHT = 64;
var ACCOUNT_HEADER_HEIGHT = 30;
var FAB_HEIGHT = 80; // 140

var Settings;
var accounts;
var totalUnreadCount;
var zoomFactor;
var bgObjectsReady;

console.time("zoomfactor");
var zoomPromise = getZoomFactor().then(function(thisZoomFactor) {
	console.timeEnd("zoomfactor");
	zoomFactor = thisZoomFactor;
})

bg.buttonIcon.stopAnimation();

if (location.href.indexOf("source=widget") != -1) {
	inWidget = true;
} else if (location.href.indexOf("source=toolbar") != -1) {
	fromToolbar = true;
} else {
	isDetached = true;
}

if (location.href.indexOf("source=notification") != -1) {
	isTemporaryPopup = true;
}

// check if opening popup from notification and thus directly opening message
var previewMailId = getUrlValue(location.href, "previewMailId");

// 25% CPU issue caused when calling window.close "before" the following execution stopped - inside previewing an email view and then trying to close it to show inbox view (which animates)
function closeWindow(params) {
	params = initUndefinedObject(params);
	
	console.log("closeWindow: " + params.source);
	
	if (fromToolbar || isTemporaryPopup) {
		if (params.delay) {
			closeWindowTimeout = setTimeout(function() {
				window.close();
			}, params.delay);
		} else {
			window.close();
		}
	} else {
		if (!isInboxView()) {
			openInbox();
		}
	}
}

function isInboxView() {
	if ($("#inboxSection").hasClass("active")) {
		return true;
	}
}

function isEmailView() {
	if ($("#openEmailSection").hasClass("active")) {
		return true;
	}
}

function isComposeView() {
	if ($("#composeSection").hasClass("active")) {
		return true;
	}
}

function showSelectedTab(url) {
	if (url) {
		$(".tab").removeClass("selected");
		
		if (url.endsWith("/%5Ei") || url.endsWith("/Inbox") || url.indexOf("/Inbox/") != -1) {
			$("#tabInbox").addClass("selected");
		} else if (url.endsWith("/Important") || url.indexOf("/Important/") != -1) {
			$("#tabImportant").addClass("selected");
		} else if (url.endsWith("/All%20Mail") || url.indexOf("/All%20Mail/") != -1) {
			$("#tabAllMail").addClass("selected");
		} else if (url.indexOf("smartlabel_personal") != -1) {
			$("#tabPrimary").addClass("selected");
		} else if (url.indexOf("smartlabel_receipt") != -1) {
			$("#tabPurchases").addClass("selected");
		} else if (url.indexOf("smartlabel_finance") != -1) {
			$("#tabFinance").addClass("selected");
		} else if (url.indexOf("smartlabel_social") != -1) {
			$("#tabSocial").addClass("selected");
		} else if (url.indexOf("smartlabel_promo") != -1) {
			$("#tabPromotions").addClass("selected");
		} else if (url.indexOf("smartlabel_notification") != -1) {
			$("#tabUpdates").addClass("selected");
		} else if (url.indexOf("smartlabel_group") != -1) {
			$("#tabForums").addClass("selected");
		} else {
			// viewing a label: #tl/apps
			// viewing an email inside a label: #cv/apps/47120957120498
			var label = url.match(/#tl\/(.*)/);
			if (!label) {
				label = url.match(/#cv\/(.*)\//);
			}
			if (label) {
				try {
					$("#label_" + label[1]).addClass("selected");
				} catch (e) {
					console.error("error with #label_ : " + label[1], e);
				}
			}
		}
	}
}

function initTabs(email) {
	// init tabs
	var tabs;
	var account = getAccountByEmail(email);
	if (account) {
		tabs = account.getSetting("tabs");
		
		// add enabled tabs only
		var tabsArray = [];
		for (tab in tabs) {
			if (tabs[tab]) { // check if enabled
				tabsArray.push(initTab(account, tab));
			}
		}
		
		tabsArray.sort(function($a, $b) {
			if (parseInt($a.attr("sortIndex")) < parseInt($b.attr("sortIndex"))) {
				return -1;
			} else if (parseInt($a.attr("sortIndex")) > parseInt($b.attr("sortIndex"))) {
				return 1;
			} else {
				return 0;
			}
		});
		
		var SHRINK_TABS_THRESHOLD = 6;
		if (tabsArray.length > SHRINK_TABS_THRESHOLD) {
			$("#tabs").addClass("shrink");
		}
		$("#tabs")
			.empty()
			.append( tabsArray )
		;
		
		if (tabsArray.length) {
			$("html").addClass("hasTabs");
		} else { //if ($.isEmptyObject(tabs)) {
			$("html").removeClass("hasTabs");
		}
		
		resizeFrameInExternalPopup();

		// sync labels after display them (because the callback might delay the tabs from initially showing) remove any renamed or deleted from the settings
		account.getLabels().then(response => {
			if (response && response.labels && response.labels.length && tabs) {
				var tabsUnsynced;
				for (tab in tabs) {
					var tabFoundInLabels = false;
					for (var a=0; a<response.labels.length; a++) {
						if (response.labels[a].id.equalsIgnoreCase(tab)) {
							tabFoundInLabels = true;
							break;
						}
					}
					
					if (!isSystemLabel(tab) && !tabFoundInLabels) {
						console.log("remove this tab from settings: " + tab);
						delete tabs[tab];
						tabsUnsynced = true;
					}
				}
				
				if (tabsUnsynced) {
					console.log("rescyning tabs");
					var emailSettings = Settings.read("emailSettings");
					emailSettings[email].tabs = tabs;
					Settings.store("emailSettings", emailSettings);
					
					// force refresh of labels
					account.getLabels(true).then(function() {
						showMessage("You have renamed or removed some Gmail labels. You have to re-select them in the extension options.");
					});
				}
			}
		}).catch(error => {
			showError("Error loading labels: " + error);
		});
	
	}
	
	showSelectedTab(Settings.read("tabletViewUrl"));
}

function initTab(account, tabName) {
	var $tab = $("<div class='tab visible'/>");
	var tabId;
	var sortIndex;
	if (tabName == SYSTEM_INBOX) {
		tabId = "tabInbox";
		tabTitle = getMessage("inbox");
		sortIndex = 0;
	} else if (tabName == SYSTEM_IMPORTANT) {
		tabId = "tabImportant";
		tabTitle = getMessage("important");
		sortIndex = 1;
	} else if (tabName == SYSTEM_ALL_MAIL) {
		tabId = "tabAllMail";
		tabTitle = getMessage("allMail");
		sortIndex = 2;
	} else if (tabName == SYSTEM_PRIMARY) {
		tabId = "tabPrimary";
		tabTitle = getMessage("primary");
		sortIndex = 3;
	} else if (tabName == SYSTEM_PURCHASES) {
		tabId = "tabPurchases";
		tabTitle = getMessage("purchases");
		sortIndex = 4;
	} else if (tabName == SYSTEM_FINANCE) {
		tabId = "tabFinance";
		tabTitle = getMessage("finance");
		sortIndex = 5;
	} else if (tabName == SYSTEM_SOCIAL) {
		tabId = "tabSocial";
		tabTitle = getMessage("social");
		sortIndex = 6;
	} else if (tabName == SYSTEM_PROMOTIONS) {
		tabId = "tabPromotions";
		tabTitle = getMessage("promotions");
		sortIndex = 7;
	} else if (tabName == SYSTEM_UPDATES) {
		tabId = "tabUpdates";
		tabTitle = getMessage("updates");
		sortIndex = 8;
	} else if (tabName == SYSTEM_FORUMS) {
		tabId = "tabForums";
		tabTitle = getMessage("forums");
		sortIndex = 9;
	} else {
		if (tabName) {
			var labelName = account.getLabelName(tabName);
			console.log("names: ", tabName, labelName)
			// keep it lower case and insidew tablet.js also, seems that when clicking nonsystem labels it resets to inbox after a few seconds??
			if (labelName) {
				tabId = "label_" + labelName.toLowerCase();
				// Nested labels use / but the /mu/ uses -    ... so let's replace themm all from / to -
				tabId = tabId.replaceAll("/", "-");
				console.log("tabid: " + tabId);
				tabTitle = labelName;
				sortIndex = labelName.toLowerCase().charCodeAt(0);
			}
		}
	}
	
	$tab
		.attr("id", tabId)
		.attr("sortIndex", sortIndex)
		.attr("title", tabTitle)
		.text(tabTitle)
		.addClass("visible")
		.off().on("click", function() {
			var thisTabId = $(this).attr("id");
			tabletFramePort.postMessage({action: "goToLabel", label:thisTabId});
		})
	;

	return $tab;
}

function initPopupView() {
	
	initSwitchMenuItem();
	
	console.log("initpopupview: " + popupView);
	$(document).ready(function() {
		if (popupView == POPUP_VIEW_CHECKER_PLUS) {
			$("html")
				.removeClass("tabletView")
				.addClass("checkerPlusView")
			;
		} else {
			// TABLET VIEW
			
			//closeDrawer();

			$("html")
				.removeClass("checkerPlusView")
				.addClass("tabletView")
			;
			
			// display any errors with accounts above
			if (accounts && accounts.length) {
				$.each(accounts, function(index, account) {
					if (account.error) {
						setTimeout(function() {
							showError(account.getAddress() + ": " + account.getError().niceError + " - " + account.getError().instructions);
						}, 500)
						return false;
					}
				});			   
			} else {
				setTimeout(function() {
					showError("Refresh or sign out and in!");
				}, 500)
			}
			
			var urlPrefix = "https://mail.google.com/mail/mu/mp/?mui=checkerPlusForGmail&hl=" + Settings.read("language");

			var url;
			if (previewMailId) {
				var mail = findMailById(previewMailId);
				
				var mobileViewFolder;
				if (mail && mail.monitoredLabel == SYSTEM_PRIMARY) {
					mobileViewFolder = "priority/%5Esmartlabel_personal";
				} else {
					mobileViewFolder = "Inbox";
				}
				url = urlPrefix + "#cv/" + mobileViewFolder + "/" + previewMailId;
			} else {
				url = Settings.read("tabletViewUrl");
			}
			
			if (!url) {
				url = urlPrefix;
			}

			$("#tabletViewFrame")
				.attr("src", url)
				.off("load").on("load", function() {
						console.log("frame loaded " + new Date());
						// backup method: if could not detect current email from frame then let's default to first email from accounts detected
						setTimeout(function() {
							console.log("detect email timeout reached " + new Date());
							if (!currentTabletFrameEmail) {
								console.log("timeout default to first detected account");
								initTabs(getFirstActiveEmail(accounts));
							}
						}, 500);
						
					})
				.focus()
			;
			
		}
	});
}

function reversePopupView(force) {
	console.log("reversepopupview");
	if (force || !reversingView) {
		reversingView = true;
		
		// reverse view
		if (popupView == POPUP_VIEW_CHECKER_PLUS) {
			popupView = POPUP_VIEW_TABLET;
			Settings.store("browserButtonAction", BROWSER_BUTTON_ACTION_GMAIL_INBOX);
		} else {
			popupView = POPUP_VIEW_CHECKER_PLUS;
			Settings.store("browserButtonAction", BROWSER_BUTTON_ACTION_CHECKER_PLUS);
		}
		console.log("keydown: " + popupView);
		
		initPopupView();
	}
}

function resizeFrameInExternalPopup() {
	// Force resize to resize tabletviewframe
	if (isDetached && popupView == POPUP_VIEW_TABLET) {
		setTimeout(function() {
			resizeNodes();
		}, 10);
	}
}

function initSwitchMenuItem() {
	if (popupView == POPUP_VIEW_CHECKER_PLUS) {
		$(".switchViewLabel").text(getMessage("switchToInbox"));
	} else {
		$(".switchViewLabel").text(getMessage("switchToCheckerPlus"));
	}
}

function getBGObjects() {
	return new Promise(function(resolve, reject) {
		console.time("getBGObjects");
		
		// bg is always declared in checkerPlusForGmail.js so we must check the location for background to verify it's really pointing to the bg file
		if (window.bg && window.bg.location.href.indexOf("background") != -1) {
			
			Settings = bg.Settings;
			accounts = bg.accounts;
			totalUnreadCount = bg.unreadCount;
			
			skinsSettings = Settings.read("skins");

			console.timeEnd("getBGObjects");
			resolve();
		} else {
			chrome.runtime.sendMessage({name:"getBGObjects"}, function(response) {
				
				Settings = response.Settings;
				accounts = response.accounts;
				totalUnreadCount = response.unreadCount;
				
				resolve(response);
			});
		}
	});
}

function executeAction(params) {
	console.log("outside params", params);
	return new Promise(function(resolve, reject) {
		console.log("inside params", params);
		var $mail = getMailNode(params.mail.id);
		
		if (!params.actionParams) {
			params.actionParams = {};
		}
		
		// append to params
		params.actionParams.instantlyUpdatedCount = true;

		console.log("in for sure params", params);
		params.mail[params.action](params.actionParams).then(response => {
			resolve();
		}).catch(error => {
			var errorStr;
			if (error.errorCode == 503) {
				errorStr = error + ". " + getMessage("tryAgainLater");
			} else {
				if (Settings.read("accountAddingMethod") == "autoDetect") {
					errorStr = error + ". " + getMessage("signOutAndIn");
				} else {
					errorStr = error;
				}
			}
			setTimeout(function() {
				clearTimeout(closeWindowTimeout);
			}, 200);
			showError(errorStr);
			reject(error);
		});
		
		if (params.keepInInboxAsRead) {
			$mail.removeClass("unread");
			updateUnreadCount(-1, $mail);
		} else {
			hideMail($mail, params.autoAdvance);
		}
	});
}

function setContactPhoto(params, imageNode) {

	function setNoPhoto() {
		imageNode.attr("src", "images/noPhoto.svg");
		imageNode.addClass("noPhoto");
	}

	// contact photo
	getContactPhoto(params, function(response) {
		imageNode.attr("setContactPhoto", "true");
		
		if (params.useNoPhoto && !response.realContactPhoto) {
			setNoPhoto();
		} else if (response.photoUrl) {
			imageNode.on("error", function() {
				setNoPhoto();
			});
			
			// used timeout because it was slowing the popup window from appearing
			setTimeout(function() {
				if (imageNode.is(":visible")) {
					imageNode.attr("src", response.photoUrl);
				}
			}, params.delay ? params.delay : 20);
		} else {
			if (params.useNoPhoto) {
				setNoPhoto();
			} else {
				var name;			
				if (params.name) {
					name = params.name;
				} else if (params.mail) {
					name = params.mail.getName();
				}
				
				var letterAvatorWord;
				if (name) {
					letterAvatorWord = name;
				} else {
					letterAvatorWord = params.email;
				}
				imageNode
					.removeAttr("fade")
					.attr("src", letterAvatar(letterAvatorWord))
				;
			}
		}
	});
}

function letterAvatar(name, color) {
	var colours = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"];
	
	if (!name) {
		name = " ";
	}
	 
	var letter = name.charAt(0).toUpperCase();
	var letterCode = letter.charCodeAt();
	 
	var charIndex = letterCode - 64,
	    colourIndex = charIndex % 20;
	 
	var canvas = document.getElementById("letterAvatar");
	var context = canvas.getContext("2d");
	 
	var canvasWidth = $(canvas).attr("width"),
	    canvasHeight = $(canvas).attr("height"),
	    canvasCssWidth = canvasWidth,
	    canvasCssHeight = canvasHeight;
	 
	
	// commented out because caused slow down issue in popup
	/*
	if (window.devicePixelRatio) {
	    $(canvas).attr("width", canvasWidth * window.devicePixelRatio);
	    $(canvas).attr("height", canvasHeight * window.devicePixelRatio);
	    $(canvas).css("width", canvasCssWidth);
	    $(canvas).css("height", canvasCssHeight);
	    context.scale(window.devicePixelRatio, window.devicePixelRatio);
	}
	*/
	
	if (color) {
		context.fillStyle = color;
	} else {
		context.fillStyle = colours[colourIndex];
	}
	context.fillRect (0, 0, canvas.width, canvas.height);
	context.font = "128px Arial";
	context.textAlign = "center";
	context.fillStyle = "#FFF";
	context.fillText(letter, canvasCssWidth / 2, canvasCssHeight / 1.5);
	
	return canvas.toDataURL();
}

function hideMail($mail, autoAdvance) {
	console.log("hideMail");
	var mail = $mail.data("mail");
	
	// commented because was choppy
	/*
	$(node).animate({
	    opacity: 0,
	    height: 0
	}, 2000, ["swing"], function() {
		$(node).remove();
		if ($(".mail").length == 0) {
			window.close();
		}
	});
	*/
	
	if (mail) {
		hiddenMails.push(mail.id);
	}
	
	var wasUnread = $mail.hasClass("unread");
	
	var onlyMailAndInPreview = false;
	/*
	 * commented because we added an undo notification that we wanted to be show before closing
	// if in open email view and it's the only mail left then just close window with no animation 
	if ($(".mail").length == 1 && document.querySelector('neon-animated-pages').selected == 1) {
		onlyMailAndInPreview = true;
	}
	*/
	
	if (!onlyMailAndInPreview) {
		$mail
			// queue=false so they run immediately and together
			.slideUp({ duration: 'fast', queue: false })
			.fadeOut({ duration: 'fast', queue: false, always:function() {
				$mail.remove();
				
				// had to wait till mail node was removed to init prev next buttons
				var openMail = getOpenEmail();
				if (openMail) {
					var $openMail = getMailNode(openMail.id);
					initPrevNextButtons($openMail);
				}
				
				if (mail) {
					console.log("pass exclude id: " + mail.title);
				}
				renderMoreAccountMails();
				
				if ($(".mail").length == 0) {
					closeWindow({source:"!onlyMailAndInPreview", delay:seconds(2)});
				}
			}})
		;
	}

	// for text notifications
	if (bg.notification) {
		bg.notification.close();
	}

	// for rich notifications
	bg.updateNotificationTray();
	
	if (wasUnread) {
		updateUnreadCount(-1, $mail);
	}
	
	if (onlyMailAndInPreview) {
		closeWindow({source:"onlyMailAndInPreview"});
	} else {
		if (autoAdvance) {
			autoAdvanceMail($mail);
		}
	}
}

function getAccountAvatar(account) {
	var $retAccountAvatar;
	
	$(".accountAvatar").each(function() {
		var $accountAvatar = $(this);
		if ($accountAvatar.data("account").id == account.id) {
			//setAvatarUnreadCount($accountAvatar, unreadCount);
			$retAccountAvatar = $accountAvatar;
			return false;
		}
	});
	
	return $retAccountAvatar;
}

function setUnreadCountLabels($account) {
	var account = $account.data("account");
	var $unreadCount = $account.find(".unreadCount");
	var unreadCount = $unreadCount.data("count");
	if (unreadCount == undefined) {
		unreadCount = account.unreadCount;
	}
	
	if (unreadCount >= 1) {
		$account.addClass("hasUnread");
		$unreadCount
			.text("(" + unreadCount + ")")
			.show()
		;
	} else {
		$account.removeClass("hasUnread");
		$unreadCount.hide();
	}
	
	if ($account.find(".mail").length) {
		$account.addClass("hasMail");
	} else {
		$account.removeClass("hasMail");
	}
	
	var $accountAvatar = getAccountAvatar(account);
	
	if ($accountAvatar) {
		setAvatarUnreadCount($accountAvatar, unreadCount);
	}
}

function setAccountAvatar($account, $accountAvatar) {
	var account = $accountAvatar.data("account");
	var $accountPhoto = $accountAvatar.find(".accountPhoto");
	
	var profileInfo = account.getSetting("profileInfo");
	if (profileInfo) {
		setTimeout(function() {
			$account.find(".accountPhoto").attr("src", profileInfo.image.url);
			$accountPhoto.attr("src", profileInfo.image.url);
		}, 20);
	} else {
		$account.find(".accountPhoto").hide();
		
		var color;
		if (account.getSetting("accountColor") == "transparent") {
			color = "#ccc";
		} else {
			color = account.getSetting("accountColor");
		}
		$accountPhoto.attr("src", letterAvatar(account.getEmailDisplayName(), color));
	}
}

function setAvatarUnreadCount($accountAvatar, unreadCount) {
	var account = $accountAvatar.data("account");
	var $unreadCount = $accountAvatar.find(".accountAvatarUnreadCount");
	if (unreadCount >= 1) {
		$unreadCount
			.text(unreadCount)
			.show();
		;
	} else {
		$unreadCount.hide();
	}
}

function updateUnreadCount(offset, $mail) {
	console.log("updateUnreadCount offset: "  + offset);
	var $account = $mail.closest(".account");
	var account = $account.data("account");
	
	var $unreadCount = $account.find(".unreadCount");
	var unreadCount = $unreadCount.data("count");
	if (unreadCount == undefined) {
		unreadCount = account.unreadCount;
	}
	unreadCount += offset;
	
	$unreadCount.data("count", unreadCount);
	
	setUnreadCountLabels($account);

	// update background unreadcount because it was out of sync after marking an email as read (since we don't poll immedaitely after), the count will be temporary because it will be overwritten on every poll
	bg.unreadCount += offset;

	updateBadge(bg.unreadCount);
}

// try to sync highlight BOTH mail and openEmail stars
function initStar($star, mail) {
	var $mail = getMailNode(mail.id);
	var $mailStar = $mail.find(".star");
	var $starNodes = $star.add($mailStar);
	
	//if (Settings.read("accountAddingMethod") == "oauth") {
		if (mail.hasLabel(SYSTEM_STARRED)) {
			$starNodes.attr("icon", "star");
		}
	//}
	
	if ($mailStar.attr("icon") == "star") {
		$starNodes.attr("icon", "star");
	}
	
	$star
		.off()
		.click(function(event) {
			if ($(this).attr("icon") == "star") {
				//if (Settings.read("accountAddingMethod") == "oauth") {
					$starNodes.attr("icon", "star-border");
					mail.removeStar();
				//}
			} else {
				$starNodes.attr("icon", "star");
				mail.star();
			}
			return false;
		})
	;
}

function setContactPhotos(accounts, $mailNodes) {
	ensureContactsWrapper(accounts).then(function() {
		$mailNodes.each(function(index, mailNode) {
			var mail = $(mailNode).data("mail");
			if (mail) {
				// photo
				var $imageNode = $(this).find(".contactPhoto");
				
				// if not already set
				if (!$imageNode.attr("setContactPhoto")) {
					// function required to keep imageNode in scope
					setContactPhoto({mail:mail}, $imageNode);
				}
			}
		});
	});
}

function openMailInBrowser(mail, event) {
	var openParams = {};
	if (isCtrlPressed(event) || event.which == 2) {
		openParams.openInBackground = true;
	}
	mail.open(openParams);
	if (!openParams.openInBackground) {
		setTimeout(function () {
			closeWindow({ source: "openMailInBrowser" });
		}, 100);
	}
}

function openDialogWithSearch($dialog, $search, $selectionsWrapper, $selections) {
	setTimeout(function() {
		openDialog($dialog).then(function(response) {
			// because i DID NOT set autoCloseDisabled="true" then the .close happens automatically
		}).catch(function(error) {
			// on close
			showError("error: " + error);
		});
		$dialog.on("iron-overlay-opened", () => {
			$search
				.val("")
				.focus()
				.css("opacity", 1)
				.keyup(function(e) {
					if (e.keyCode == 40) {
						$selectionsWrapper.focus();
						return false;
					} else {
						var str = $(this).val();
						$selections.each(function() {
							if ($(this).text().trim().toLowerCase().startsWith(str)) {
								$(this).removeAttr("hidden");
								$(this).removeAttr("disabled");
							} else {
								$(this).attr("hidden", "");
								$(this).attr("disabled", "");
							}
						});
					}
				})
			;
			$search.focus();
		});
	}, 1);
}

function initOpenEmailEventListeners() {
	
	$("#back").click(function() {
		openInbox();
	});

	$("#openEmailSection").click(function(e) {
		if (e.button == 3) { // Back button on mouse, ref: https://jasonsavard.com/forum/discussion/3405/hotkey-improvement
			openInbox();
		}
	});

	$("#prevMail").click(function() {
		if ($(this).hasClass("visible")) {
			var mail = getOpenEmail();
			var $mail = getMailNode(mail.id);
			
			openPrevMail($mail);
		}
	});

	$("#nextMail").click(function() {
		if ($(this).hasClass("visible")) {
			var mail = getOpenEmail();
			var $mail = getMailNode(mail.id);
	
			openNextMail($mail);
		}
	});

	$("#archive").click(function() {
		executeAction({mail:getOpenEmail(), action:"archive", autoAdvance:true});
	});

	$("#delete").click(function() {
		var mail = getOpenEmail();
		executeAction({mail:mail, action:"deleteEmail", autoAdvance:true});
		showUndo({mail:mail, text:getMessage("movedToTrash"), undoAction:"untrash"}).then(function() {
			openEmail({mail:mail});
		});
	});

	$("#markAsRead, #markAsUnread").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail.id);

		if ($(this).attr("id") == "markAsRead") {
			executeAction({mail:mail, action:"markAsRead", autoAdvance:true});
			var text = mail.account.getSetting("openLinksToInboxByGmail") ? getMessage("markedAsDone") : getMessage("markedAsRead");
			showUndo({mail:mail, text:text, undoAction:"markAsUnread"}).then(function() {
				openEmail({mail:mail});
			});
		} else { // mark as UNread
			openInbox();
			
			mail.markAsUnread();
			$mail.addClass("unread");
			updateUnreadCount(+1, $mail);
		}
	});

	$("#addToGoogleCalendar").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail.id);
		
		var newEvent = {};
		newEvent.allDay = true;
		newEvent.summary = mail.title;
		//newEvent.source = {title:mail.title, url:mail.getUrl()};
		newEvent.description = mail.getUrl() + "\n\n" + mail.messages.last().content.htmlToText(); //mail.getLastMessageText();
		
		console.log("newEvent", newEvent);
		
		sendMessageToCalendarExtension({action:"generateActionLink", eventEntry:JSON.stringify(newEvent)}).then(function(response) {
			console.log("response: ", response);
			if (response && response.url) {
				openUrl(response.url);
			} else if (response && response.error) {
				showError(response.error);
			} else {
				// not supported yet
				openGenericDialog({
					title: "Not supported yet",
					content: "The extension Checker Plus for Google Calendar is required.<br>But your version does not currently support this feature.",
					showCancel: true,
					okLabel: "Update extension"
				}).then(function(response) {
					if (response == "ok") {
						openUrl("https://jasonsavard.com/wiki/Extension_Updates");
					}
				})
			}
		}).catch(response => {
			// not installed or disabled
			hideSaving();
			
			requiresCalendarExtension("addToGoogleCalendar");
		});

	});

	$("#moveLabel").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail.id);

		var $moveLabelDialog = initTemplate("moveLabelDialogTemplate");
		
		showLoading();
		mail.account.getLabels().then(response => {
			hideLoading();
			
			//$("#moveLabelTemplate")[0].labels = response.labels;
			// labels
			var labelsTemplate = $moveLabelDialog.find("#moveLabelTemplate")[0];
			var $moveLabels = $moveLabelDialog.find("#moveLabels");
			//$moveLabels.find(".moveLabel").remove();
			$moveLabels.find(".moveLabel").each(function() {
				Polymer.dom(Polymer.dom(this).parentNode).removeChild(this);
				Polymer.dom.flush();
			});
			
			// shallow copy
			var labels = response.labels.slice(0);

			if (Settings.read("accountAddingMethod") == "oauth") {
				// Add categories at end of dropdown
				labels.push({id:GmailAPI.labels.CATEGORY_PERSONAL, name:getMessage("primary")});
				labels.push({id:GmailAPI.labels.CATEGORY_SOCIAL, name:getMessage("social")});
				labels.push({id:GmailAPI.labels.CATEGORY_PROMOTIONS, name:getMessage("promotions")});
				labels.push({id:GmailAPI.labels.CATEGORY_UPDATES, name:getMessage("updates")});
				labels.push({id:GmailAPI.labels.CATEGORY_FORUMS, name:getMessage("forums")});
			}
			
			labels.forEach(function(labelObj) {
				var labelNode = document.importNode(labelsTemplate.content, true);
				//$moveLabels.append(labelNode);
				// FYI need to wrap paper-item with a paper-menu to capture up/down keys
				// patch: Must use Polymer dom append to insert node into paper-menu's shadow dom <div selected... ref: https://github.com/PolymerElements/paper-menu/issues/21
				var response = Polymer.dom($moveLabels[0]).appendChild(labelNode);
				// since Polymer.dom->appendChild is async we must flush to make sure the node is created, ref: https://www.polymer-project.org/1.0/docs/devguide/local-dom
				Polymer.dom.flush();
				var $label = $moveLabels.find(".moveLabel").last();
				
				$label
					.click(function() {
						executeAction({mail:mail, action:"moveLabel", actionParams:{newLabel:labelObj.id}, autoAdvance:true}).then(function() {
							showMessage("Moved to " + labelObj.name);
						});
						$moveLabelDialog[0].close();
					})
				;
				$label.find(".labelText").text(labelObj.name);
				
			});
			
			openDialogWithSearch($moveLabelDialog, $("#moveLabelSearch"), $moveLabels, $(".moveLabel"));
		}).catch(error => {
			hideLoading();
			showError("error: " + error);
		});
		
	});
	
	$("#changeLabels").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail.id);

		var $changeLabelsDialog = initTemplate("changeLabelsDialogTemplate");
		
		showLoading();
		mail.account.getLabels().then(response => {
			hideLoading();
			
			var labelsTemplate = $changeLabelsDialog.find("#changeLabelTemplate")[0];
			var $changeLabelsWrapper = $changeLabelsDialog.find("#changeLabelsWrapper");
			//$changeLabelsWrapper.find(".labelWrapper").remove();
			$changeLabelsWrapper.find(".labelWrapper").each(function() {
				Polymer.dom(Polymer.dom(this).parentNode).removeChild(this);
				Polymer.dom.flush();
			});
			
			// shallow copy
			var labels = response.labels.slice(0);

			if (Settings.read("accountAddingMethod") == "oauth") {
				// Add categories at end of dropdown
				labels.push({id:GmailAPI.labels.CATEGORY_PERSONAL, name:getMessage("primary")});
				labels.push({id:GmailAPI.labels.CATEGORY_SOCIAL, name:getMessage("social")});
				labels.push({id:GmailAPI.labels.CATEGORY_PROMOTIONS, name:getMessage("promotions")});
				labels.push({id:GmailAPI.labels.CATEGORY_UPDATES, name:getMessage("updates")});
				labels.push({id:GmailAPI.labels.CATEGORY_FORUMS, name:getMessage("forums")});
			}
			
			labels.forEach(function(labelObj) {
				var labelNode = document.importNode(labelsTemplate.content, true);
				//$changeLabelsWrapper.append(labelNode);
				Polymer.dom($changeLabelsWrapper[0]).appendChild(labelNode);
				// since Polymer.dom->appendChild is async we must flush to make sure the node is created, ref: https://www.polymer-project.org/1.0/docs/devguide/local-dom
				Polymer.dom.flush();
				var $checkbox = $changeLabelsWrapper.find(".labelWrapper").last();
				
				console.log("checkbox", $checkbox.length);
				
				$checkbox[0].checked = mail.hasLabel(labelObj.id);
				
				$checkbox
					.on("change", function() {
						if ($checkbox[0].checked) {
							// add label
							mail.applyLabel(labelObj.id).then(function(response) {
								showMessage(getMessage("labelAdded"));
							});
						} else {
							// remove labels
							mail.removeLabel(labelObj.id).then(function() {
								showMessage(getMessage("labelRemoved"));
							});
						}
					})
				;
				//$checkbox.find("#checkboxLabel").text(labelObj.name);
				Polymer.dom($checkbox[0]).textContent = labelObj.name;
				
			});
			
			openDialogWithSearch($changeLabelsDialog, $("#changeLabelSearch"), $changeLabelsWrapper, $(".labelWrapper"));
		}).catch(error => {
			hideLoading();
			showError("error: " + error);
		});
		
	});
	
	$("#markAsSpam").click(function() {
		executeAction({mail:getOpenEmail(), action:"markAsSpam", autoAdvance:true});
	});

	$("#revertAutoSizing").click(function() {
		$("#openEmail").toggleClass("resized");
	});

	$("#listenToEmail").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail.id);

		showToast({toastId:"playingEmail", text:"Playing email...", duration:9999, actionParams:{
			text:"Stop",
			onClick: function() {
				bg.ChromeTTS.stop();
			}
		}});
		
		bg.ChromeTTS.queue(mail.getLastMessageText()).then(() => {
			dismissToast($("#playingEmail"));
		}).catch(error => {
			dismissToast($("#playingEmail"));
			showError(error);
		});
	});
	
	$("#openEmailInBrowser").click(function(event) {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail.id);

		openMailInBrowser(mail, event);
		return false;
	});
	
	$("#openEmailClose").click(function() {
		closeWindow();
	});
	
	
	initOpenEmailEventListenersLoaded = true;
}

function maxHeightOfPopup() {
	if (fromToolbar) {
		//$("body").height(MAX_POPUP_HEIGHT / window.devicePixelRatio);
		zoomPromise.then(function() {
			console.log("zoomfactor: " + zoomFactor);
			$("body").height(MAX_POPUP_HEIGHT / zoomFactor);
		})
	}
}

function resizePopup() {
	console.log("resizePopup");
	if (fromToolbar) {
		bgObjectsReady.then(function() {
			
			getZoomFactor().then(function(zoomFactor) {
				if (zoomFactor > 1 || popupView == POPUP_VIEW_TABLET) {
					maxHeightOfPopup();
				} else {
					if (accounts.length) {
						var allUnreadMails = getAllUnreadMail(accounts);
						
						var mailHeight;
						if (Settings.read("displayDensity") == "compact") {
							mailHeight = 79;
						} else if (Settings.read("displayDensity") == "cozy") {
							mailHeight = 89;
						} else {
							mailHeight = 107;
						}
						
						var newBodyHeight = HEADER_HEIGHT + (accounts.length * ACCOUNT_HEADER_HEIGHT) + (allUnreadMails.length * mailHeight) + FAB_HEIGHT + 25;
						if (newBodyHeight > MAX_POPUP_HEIGHT) {
							newBodyHeight = MAX_POPUP_HEIGHT;
						}
						
						console.log("resizePopup2");
						// only need to set the height if it will be larger than exsiting, because we can't shrink the popup window - it will cause scrollbars
						if ($("body").height() < newBodyHeight) {
							// patch for mac issue popup clipped at top ref: https://bugs.chromium.org/p/chromium/issues/detail?id=428044
							setTimeout(() => {
								$("body").height(newBodyHeight);
							}, DetectClient.isMac() ? 100 : 1); // tried 100, 150, now 250
						}
					}
				}
			});
			
		});
	}
}

function openEmail(params) {
	return new Promise((resolve, reject) => {
		$("body").addClass("page-loading-animation");
		polymerPromise2.then(function() {
			$("body").removeClass("page-loading-animation");
			maxHeightOfPopup();
			
			var mail = params.mail;
			if (mail) {
				openEmailPromise(params).then(() => {
					resolve();
				}).catch(error => {
					logError(error);
					showError("error: " + error);
					reject(error);
				})
			} else {
				var error = "Email might already be read!";
				showError(error);
				reject(error);
			}
		});
	});
}

function initPrevNextButtons($mail) {
	var hasPrevMail = $mail.index(".mail") != 0;
	$("#prevMail").toggleClass("visible", hasPrevMail);
	var hasNextMail = $mail.index(".mail") < $(".mail").length - 1;
	$("#nextMail").toggleClass("visible", hasNextMail);
}

function processMessage(mail, $messageBody, index) {
	console.log("process message")
	if (Settings.read("accountAddingMethod") == "oauth") {
		// must do this before interceptClicks
		var linkedText = Autolinker.link( $messageBody.html(), {
			stripPrefix : false,
		    replaceFn : function( autolinker, match ) {
		    	//console.log("match", match)
		        //console.log( "href = ", match.getAnchorHref() );
		        //console.log( "text = ", match.getAnchorText() );

		        switch( match.getType() ) {
		            case 'url' :
		                //console.log( "url: ", match.getUrl() );
		                
		                // if google.com do not prepend http:// to the text (of course to url is ok and mandatory)
		                if (!match.protocolUrlMatch) {
		                	var tag = autolinker.getTagBuilder().build( match ); 
		                	//console.log("fixing: " + match.matchedText);
		                	tag.setInnerHtml(match.matchedText);
		                	return tag;
		                }

		                /*
		                if( match.getUrl().indexOf( 'mysite.com' ) === -1 ) {
		                    var tag = autolinker.getTagBuilder().build( match );  // returns an `Autolinker.HtmlTag` instance, which provides mutator methods for easy changes
		                    //tag.setAttr( 'rel', 'nofollow' );
		                    //tag.addClass( 'external-link' );
		                    return tag;
		                } else {
		                    return true;  // let Autolinker perform its normal anchor tag replacement
		                }
		                */
		            /*
		            case 'email' :
		                var email = match.getEmail();
		                console.log( "email: ", email );

		                if( email === "my@own.address" ) {
		                    return false;  // don't auto-link this particular email address; leave as-is
		                } else {
		                    return;  // no return value will have Autolinker perform its normal anchor tag replacement (same as returning `true`)
		                }

		            case 'phone' :
		                var phoneNumber = match.getPhoneNumber();
		                console.log( phoneNumber );

		                return '<a href="http://newplace.to.link.phone.numbers.to/">' + phoneNumber + '</a>';

		            case 'twitter' :
		                var twitterHandle = match.getTwitterHandle();
		                console.log( twitterHandle );

		                return '<a href="http://newplace.to.link.twitter.handles.to/">' + twitterHandle + '</a>';

		            case 'hashtag' :
		                var hashtag = match.getHashtag();
		                console.log( hashtag );

		                return '<a href="http://newplace.to.link.hashtag.handles.to/">' + hashtag + '</a>';
		            */
		        }
		    }
		} );
		
		$messageBody.html( linkedText );
	}
	
	if (Settings.read("highlightDates") && mail.messages.length == (index+1)) {
		console.time("DateTimeHighlighter");
		
		var highlighterDetails;
		
		// only parse if not too big or else it hangs
		// .html() can be null !!
		if ($messageBody && $messageBody.html() && $messageBody.html().length < 10000) {
			highlighterDetails = bg.DateTimeHighlighter.highlight($messageBody.html(), function(myDateRegex) {
				console.log(myDateRegex);
				var obj = JSON.stringify(myDateRegex);
				obj = encodeURIComponent(obj);
				
				return "<a class='DTH' href='#' object=\"" + obj + "\">" + myDateRegex.match + "</a>";
			});
			console.log("highlighterDetails", highlighterDetails);
			console.timeEnd("DateTimeHighlighter");
		}
		
		if (highlighterDetails && highlighterDetails.matchCount) {
			$messageBody.html(highlighterDetails.highlightedText);
			$messageBody.find(".DTH").each(function() {
				var $tooltip = $("<paper-tooltip/>");
				$(this).append($tooltip);
				$tooltip.find("#tooltip").text(getMessage("addToGoogleCalendar"));
				$(this).click(function() {
					showSaving();
					var newEvent = $(this).attr("object");
					newEvent = decodeURIComponent(newEvent);
					newEvent = JSON.parse(newEvent);
					
					newEvent.summary = mail.title;
					newEvent.source = {title:mail.title, url:mail.getUrl()};
					newEvent.description = mail.messages.last().content;
					
					console.log("newEvent", newEvent);
					sendMessageToCalendarExtension({action:"createEvent", event:JSON.stringify(newEvent)}).then(function(response) {
						console.log("response: ", response);
						hideSaving();
						if (response && response.success) {
							// nothing
						} else if (response && response.error) {
							showError(response.error);
						} else {
							// not supported yet
							openGenericDialog({
								title: "Not supported yet",
								content: "The extension Checker Plus for Google Calendar is required.<br>But your version does not currently support this feature.",
								showCancel: true,
								okLabel: "Update extension"
							}).then(function(response) {
								if (response == "ok") {
									openUrl("https://jasonsavard.com/wiki/Extension_Updates");
								}
							});
						}
					}).catch(function(response) {
						// not installed or disabled
						hideSaving();

						openGenericDialog({
							title: "Extension required",
							content: "This function requires my other extension Checker Plus for Google Calendar",
							showCancel: true,
							okLabel: "Update extension"
						}).then(function(response) {
							if (response == "ok") {
								openUrl("https://jasonsavard.com/Checker-Plus-for-Google-Calendar?ref=dateTimeParsing");
							}
						});
						
					});
				})
			});
		}
	}

	// must do this after DateTimeHighlighter
	interceptClicks($messageBody.find("a:not(.DTH)"), mail);
	
	$(".showTrimmedContent").off().click(function() {
		$(this).next().slideToggle("fast");
	});

	$messageBody.data("processMessage", true);
}

function setMailMessage($openEmailMessages, mail, message) {
	if (!message.to) {
		message.to = [];
	}
	if (!message.cc) {
		message.cc = [];
	}
	if (!message.bcc) {
		message.bcc = [];
	}
	
	var messageTemplate = document.querySelector('#openEmailMessageTemplate');
	var messageNode = document.importNode(messageTemplate.content, true);
	
	$openEmailMessages.append(messageNode);
	var $message = $openEmailMessages.find(".message").last();
	
	$message.data("message", message);
	
	// sender
	$message.find(".openEmailSender")
		.text( mail.getName(message.from) )
		.attr("title", message.from.email )
	;

	getContact({ mail:mail }, function(contact) {
		if (!contact || !contact["gContact$groupMembershipInfo"]) { // gContact$groupMembershipInfo means probably added as a contact (not just recently emailed)
			$message.find(".openEmailSenderEmailAddress").text( "<" + message.from.email + ">");
		}
	});
	
	// date
	var dateStr = message.dateStr;						
	if (message.date) {
		dateStr = message.date.displayDate({relativeDays:true});
		$message.find(".date")
			.data("data", dateStr)
			.attr("title", message.dateStr)
		;
	}
	$message.find(".date").text(dateStr);
	
	var $toCC = $("<span>").text(getMessage("to") + ": ");
	var $toCCFullDetails = $("<span>").text(getMessage("from").toLowerCase() + ": " + message.from.email).append("<br>");
	
	var firstTo = true;
	var firstCC = true;

	if (message.to.length) {
		$toCCFullDetails.append(getMessage("to") + ": ");
		$.each(message.to, function(index, to) {
			if (!firstTo) {
				$toCC.append(", ");
				$toCCFullDetails.append(", ");
			}
			firstTo = false;
			
			$toCC.append(pretifyRecipientDisplay(to, mail.account.getAddress()));
			$toCCFullDetails.append(pretifyRecipientDisplay(to, mail.account.getAddress(), true));
		});
	}
	
	if (message.cc.length) {
		if (message.to.length) {
			$toCCFullDetails.append("<br>");
		}
		$toCCFullDetails.append("cc: ");
		$.each(message.cc, function(index, cc) {
			if (!firstTo) {
				$toCC.append(", ");
			}
			firstTo = false;
			if (!firstCC) {
				$toCCFullDetails.append(", ");
			}
			firstCC = false;
			
			$toCC.append(pretifyRecipientDisplay(cc, mail.account.getAddress()));
			$toCCFullDetails.append(pretifyRecipientDisplay(cc, mail.account.getAddress(), true));
		});
	}
	
	if (message.bcc.length) {
		$toCC.append("bcc: ");
		$toCC.append(pretifyRecipientDisplay(message.bcc.first(), mail.account.getAddress()));
		
		if (message.to.length || message.cc.length) {
			$toCCFullDetails.append("<br>");
		}
		$toCCFullDetails.append("bcc: ", pretifyRecipientDisplay(message.bcc.first(), mail.account.getAddress(), true));
	}

	$message.find(".viewMessageDetails").click(function() {
		$message.find(".messageDetails").slideToggle("fast");
		return false;
	});
	
	$message.find(".to").empty().append($toCC);
	$message.find(".messageDetails").empty().append($toCCFullDetails);
	$message.find(".snippet").text(message.textContent.htmlToText());
	
	var $messageBody = $message.find(".messageBody");
	
	$messageBody.html(message.content);
	
	fixRelativeLinks($messageBody, mail);
	
	return $message;
}

function resizeMessageHeight() {
	console.log("resizeMessageHeight()")
	
	var $replyArea = $("#replyArea");
	//$("#openEmailSection #mainContainer").css("margin-bottom", ($replyArea.height() + ($replyArea.hasClass("clicked") ? 20 : 10) ) + "px");
	if ($replyArea.hasClass("clicked")) {
		setReplyAreaTop(($replyArea.height() + 22) + "px");
	} else {
		setReplyAreaTop("52px");
	}
}

function previewVideo(source) {
	var $dialog = initTemplate("videoDialogTemplate");
	var video = $("#videoDialog video")[0];
	
	video.src = source;
	video.load();
	video.play();
	
	$(video).off().click(function() {
		if (video.paused == false) {
			video.pause();
		} else {
			video.play();
		}
	});
	
	$dialog.off().on("iron-overlay-closed", function() {
		video.pause();
		video.currentTime = 0;
	});
	
	$dialog.find(".closeVideo").off().click(function() {
		$dialog[0].close();
	});
	
	openDialog($dialog).then(function(response) {
		
	});
}

function getReplyTextArea() {
	return $($("#replyTextareaWrapper")[0].textarea);
}

function setReplyAreaTop(value) {
	getShadowRoot("#openEmailSection app-header-layout").find("#contentContainer").css("margin-bottom", value);
}

function openEmailPromise(params) {
	return new Promise(function(resolve, reject) {

		var mail = params.mail;
		console.log("open email", mail);
		
		var $openEmailSection = initTemplate("openEmailSectionTemplate");

		$(".page").removeClass("active");
		$("#openEmailSection").addClass("active");

		setReplyAreaTop();

		resetOpenEmailScrollTop();

		$("#openEmail")
			.data("mail", mail)
			.addClass("resized")
		;
		
		$("#openEmail").toggleClass("facebook", mail.authorMail.indexOf("facebookmail.com") != -1);
		
		$(".u-url").text(mail.getUrl());
		$(".openEmailSubject")
			.text(mail.title ? mail.title : "(" + getMessage("noSubject") + ")")
			.off()
			.click(function(e) {
				openMailInBrowser(mail, e);
			})
		;
		
		// labels
		var labelsTemplate = $("#openEmailLabelsTemplate")[0];
		var $labels = $("#openEmailLabels");
		$labels.find(".label").remove();
		
		var labels = mail.getDisplayLabels();
		labels.forEach(function(labelObj) {
			var labelNode = document.importNode(labelsTemplate.content, true);
			$labels.append(labelNode);
			var $label = $labels.find(".label").last();
			
			$label.find(".labelName").text(labelObj.name);
			$label.find(".removeLabel").click(function() {
				mail.removeLabel(labelObj.id).then(() => {
					showMessage(getMessage("labelRemoved"));
				});
				$label.remove();
			});
			
		});
		
		initStar($("#openEmail .star"), mail);

		var $mail = getMailNode(mail.id);
		
		$(".message").remove();
		$("#messageExpander").remove();
		
		$("#openEmailProgress").addClass("visible");
		
		mail.getThread({forceDisplayImages:mail.forceDisplayImages}).then(function(response) {
			if (mail.messages && mail.messages.last()) {
				
				initPrevNextButtons($mail);
				
				var markAsReadSetting = Settings.read("showfull_read");
				
				if (markAsReadSetting) {
					$("#markAsRead").attr("hidden", true);
					$("#markAsUnread").removeAttr("hidden");
					if ($mail.hasClass("unread")) {
						executeAction({mail:mail, action:"markAsRead", keepInInboxAsRead:true});
					}
				} else {
					if ($mail.hasClass("unread")) {
						$("#markAsRead").removeAttr("hidden");
						$("#markAsUnread").attr("hidden", true);
					} else {
						$("#markAsRead").attr("hidden", true);
						$("#markAsUnread").removeAttr("hidden");
					}
				}
				
				var $openEmailMessages = $("#openEmailMessages");
				var totalHiddenMessages = 0;
				
				mail.messages.forEach(function(message, messageIndex) {
					
					var mustCollapse = false;
					var mustHide = false;
					
					if (messageIndex < mail.messages.length-1) {
						// it's an email from this user, so ignore/collapse it
						if (message.from.email == mail.account.getAddress()) {
							mustCollapse = true;
						} else {
						   if (message.date) {
							   var lastCheckedEmail = Settings.read("lastCheckedEmail");
							   if (lastCheckedEmail) {
								   // more than 24 hours collapse it before last "supposedly" user checked emails
								   if (message.date.diffInHours() <= -24 || message.date.diffInSeconds(lastCheckedEmail) < 0) {
									   mustCollapse = true;
								   }
							   } else {
								   // never last checked, might be first install or something so collapse all
								   mustCollapse = true;
							   }
						   } else {
							   // can't parse the dtes so let's only collapse last
							   mustCollapse = true;
						   }
						}
					}
					
					// hide middle messages
					if (mail.messages.length >=4 && messageIndex >= 1 && messageIndex < mail.messages.length-1) {
						// might not have been viewed yet (ie. not collapsed) so let's NOT hide it
						if (mustCollapse) {
							mustHide = true;
						}
					}
					
					// if should be hidden but user has clicked to expandMessages so don't hide them
					if (mustHide && (params.expandMessages || !Settings.read("autoCollapseConversations"))) {
						mustHide = false;
					} 
					
					// for performance, let's not create hidden thread message nodes
					if (mustHide) {
						totalHiddenMessages++;
						if (totalHiddenMessages >= 2) {
							return;
						}
					}
					
					var $message = setMailMessage($openEmailMessages, mail, message);
					var $messageBody = $message.find(".messageBody");
					
					if (Settings.read("alwaysDisplayExternalContent")) {
						// put back the imghidden to img (note: we had to manually change these when retreving the message to avoid fetching the images)
						var filteredHTML = $messageBody.html();
						if (filteredHTML.indexOf("<imghidden") != -1) {
							showImages($messageBody);
						}
					} else {
						var externalContentHidden = false;

						if (!mail.forceDisplayImages) {
							$messageBody.find("img[src], imghidden[src], input[src]").each(function() {
								//var src = $(this).attr("src");
								//if (src && !src.match(MAIL_DOMAIN + "/")) {
									$(this).removeAttr("src");
									externalContentHidden = true;
								//}
							});

							$messageBody.find("*[background]").each(function() {
								$(this).removeAttr("background");
								externalContentHidden = true;
							});
							
							$messageBody.find("*[style*='background:'], *[style*='background-image:']").each(function() {
								var style = $(this).attr("style");
								style = style.replace(/background/ig, "backgroundDISABLED");
								$(this).attr("style", style);
								externalContentHidden = true;
							});
						} else if (mail.forceDisplayImages && Settings.read("accountAddingMethod") == "oauth") {
							showImages($messageBody);
						}
						
						if (externalContentHidden) {
							showToast({toastId:"displayImages", text:"", duration:20, keepToastLinks:true});
							
							$("#displayImagesLink, #alwaysDisplayImages").off("click").on("click", function(event) {
								
								// in autodetect - img is always converted to imghidden (refer to patch 101) so we must refetch the thread
								if (Settings.read("accountAddingMethod") == "autoDetect") {
									mail.messages = null;
								}
								
								mail.forceDisplayImages = true;
								openEmail({mail:mail});
								
								if ($(this).attr("id") == "alwaysDisplayImages") {
									Settings.store("alwaysDisplayExternalContent", true);
								}
								
								dismissToast($(this));
							});
						}
					}
					
					if (mustCollapse && Settings.read("autoCollapseConversations")) {
						$message.addClass("collapsed");
					}
					
					if (mustHide) {
						$message.addClass("hide");
					}
					
					// last message
					if (messageIndex == mail.messages.length-1) {
						// just do this for last message for now - optimize
						// for h-event microformat: identify last messages as summary
						$message.addClass("p-summary");
					} else {
						// previous messages
						$message.find(".messageHeader").click(function() {
							$message.toggleClass("collapsed");
							var $messageBody = $message.find(".messageBody");
							if (!$message.hasClass("collapsed") && !$messageBody.data("processMessage")) {
								setTimeout(function() {
									processMessage(mail, $messageBody, messageIndex);
								}, 1);
							}
						});
					}
					
					// if last child is block quote then hide else keep it
					$message.find("[class$=gmail_extra], blockquote:not(.gmail_quote):last-child").each(function(index, gmailExtra) { // blockquote[type='cite'], [class$=gmail_quote], blockquote:not(.gmail_quote)
						
						// this is possibly a real quote inside the body so ignore it
						//if (this.nodeName == "BLOCKQUOTE" && this.className && this.className.indexOf("gmail_quote") != -1) {
							// continue loop
							//return true;
						//}
						
						var $trimmedContent = $(this);
						$trimmedContent.hide();
						var $elipsis = $("<div class='showTrimmedContent' title='Show trimmed content'>...</div>");
						/*
						$elipsis.click(function() {
							$trimmedContent.toggle();
						});
						*/
						$trimmedContent.before($elipsis);
						
						// if gmail_extra found then stop embedding any other ...
						if (this.className && this.className.indexOf("gmail_extra") != -1) {
							return false;
						}
					});
					
					// auto-detect files
					$message.find(".att > tbody > tr").each(function() {
						var $soundImage = $(this).find("img[src*='sound']");
						if ($soundImage.length) {
							var soundSrc = $soundImage.parent().attr("href");
							// make sure it's from the google or we might be picking up random links that made it all the way to this logic
							if (soundSrc && soundSrc.indexOf("google.com") != -1) {
								var $audio = $("<td><audio controls preload='metadata' style='margin:8px'><source/>Your browser does not support the audio element.</audio></td>");
								$audio.find("source").attr("src", soundSrc);
								$(this).append($audio);
							}
						} else if (/\.(mpg|mpeg|mp4|webm)\b/.test($(this).find("b").first().text())) {
							var videoSrc = $(this).find("a").first().attr("href");
							var $videoWrapper = $("<td class='videoWrapper'><video preload='metadata'></video><iron-icon class='videoPlayButton' icon='av:play-circle-outline'></iron-icon></td>");
							var $video = $videoWrapper.find("video");
							$video
								.attr("src", videoSrc)
								.on("loadedmetadata", function() {
									$videoWrapper.addClass("loaded");
								})
								.click(function() {
									previewVideo(videoSrc);
								})
							;
							$(this).append($videoWrapper);
						}
					});
					
					// manual files
					if (message.files && message.files.length) {
						
						var $attachmentsWrapper = $message.find(".attachmentsWrapper");

						var $attachmentDivs = [];
						message.files.forEach(function(file, fileIndex) {
							var contentDisposition = MyGAPIClient.getHeaderValue(file.headers, "Content-Disposition");
							// content id ex. "<image002.jpg@01CFC9BD.81F3BC70>"
							var contentId = MyGAPIClient.getHeaderValue(file.headers, "Content-Id");
							console.log("file", file);
							if (contentId) {
								// remove any < or > from start or end
								contentId = contentId.replace(/^</, "").replace(/>$/, "");
							}
							
							if (contentId && !/attachment\;/.test(contentDisposition)) {
								// means we have an inline image etc.
								// see if we already queued this file for fetching
								var queuedFile;
								mail.allFiles.some(function(allFile) {
									// we couldn't use attachmentid or even content id because they seemed always unique
									if (allFile.filename == file.filename && allFile.size == file.body.size) {
										queuedFile = allFile;
										return true;
									}
								});
								
								// if not then added it to the queue
								if (!queuedFile) {
									queuedFile = mail.queueFile(message.id, file);
								}
								
								queuedFile.fetchPromise.then(function(response) {
									// $messageBody context is not lost because we are inside the loop function above... $.each(response.mail.messages, function(index, message)
									var blobUrl = generateBlobUrl(response.data, file.mimeType);
									
									$messageBody.find("img").each(function() {
										if ($(this).attr("src").indexOf(FOOL_SANITIZER_CONTENT_ID_PREFIX + contentId) != -1) {
											$(this).attr("src", blobUrl); // "data:" + file.mimeType + ";base64," + response.data
										}
									});
								}).catch(function(error) {
									console.error("error in fetchpromise", error);
									$messageBody.find("img").replaceWith("<span>Error loading image: " + error + "</span>");
								});
							} else {
								var attachmentTemplate = $('#attachmentTemplate')[0];
								var attachmentTemplateNode = document.importNode(attachmentTemplate.content, true);
								
								$attachmentsWrapper.append(attachmentTemplateNode);
								var $attachmentDiv = $attachmentsWrapper.find(".attachment").last();
								
								var attachmenutImageUrl;
								var attachmentType;
								if (file.mimeType && file.mimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
									attachmenutImageUrl = "/images/driveIcons/word.png";
								} else if ((file.mimeType && file.mimeType == "application/pdf") || file.filename.indexOf(".pdf") != -1) {
									attachmenutImageUrl = "/images/driveIcons/pdf.png";
									attachmentType = "pdf";
								} else if (file.mimeType && file.mimeType.indexOf("audio/") != -1) {
									attachmenutImageUrl = "/images/driveIcons/audio.png";
									attachmentType = "audio";
								} else if (file.mimeType && file.mimeType.indexOf("video/") != -1) {
									attachmenutImageUrl = "/images/driveIcons/video.png";
									attachmentType = "video";
								} else if (file.mimeType && file.mimeType.indexOf("image/") != -1) {
									attachmenutImageUrl = "/images/driveIcons/image.png";
									attachmentType = "image";
								} else if (file.mimeType && file.mimeType.indexOf("application/vnd.ms-excel") != -1) {
									attachmenutImageUrl = "/images/driveIcons/excel.png";
								} else {
									attachmenutImageUrl = "/images/driveIcons/generic.png";
								}
								
								$attachmentDiv.find(".attachmentIcon")
									.attr("src", attachmenutImageUrl)
									.attr("title", file.mimeType)
								;
								$attachmentDiv.find(".filename").text(file.filename);
								
								$attachmentDiv.find(".downloadIcon").click(function(e) {
									showLoading();
									mail.account.fetchAttachment({messageId:message.id, attachmentId:file.body.attachmentId, size:file.body.size, noSizeLimit:true}).then(function(response) {
										hideLoading();
										downloadFile(response.data, file.mimeType, file.filename);
									}).catch(function(error) {
										console.error(error);
										showError(error);
									});
									
									e.preventDefault();
									e.stopPropagation();
								});
								
								$attachmentDiv.click(function() {
									showLoading();
									mail.account.fetchAttachment({messageId:message.id, attachmentId:file.body.attachmentId, size:file.body.size, noSizeLimit:true}).then(function(response) {
										hideLoading();
										
										if (attachmentType == "audio") {
											var $dialog = initTemplate("audioDialogTemplate");
											$("#audioDialog source")[0].src = "data:" + file.mimeType + ";base64," + response.data;

											var $audio = $dialog.find("audio");
											var audio = $audio[0];
											
											audio.load();
											audio.play();
											
											$dialog.off().on("iron-overlay-closed", function() {
												audio.pause();
												audio.currentTime = 0;
											});
											
											openDialog($dialog).then(function(response) {
												
											});
										} else if (attachmentType == "video") {
											previewVideo("data:" + file.mimeType + ";base64," + response.data);
										} else if (attachmentType == "pdf" || attachmentType == "image") {
											var blob = generateBlob(response.data, file.mimeType);
											saveToLocalFile(blob, file.filename).then(function(url) {
												openUrl(url);
											})
										} else {
											downloadFile(response.data, file.mimeType, file.filename);
										}
									}).catch(function(error) {
										console.error(error);
										showError(error);
									});
								});
							}
						});
						
						$attachmentsWrapper.removeAttr("hidden");
					}

					// set message photo
					var contactPhotoParams = $.extend({}, message.from);
					contactPhotoParams.mail = mail;
					var $imageNode = $message.find(".messageHeader .contactPhoto");
					setContactPhoto(contactPhotoParams, $imageNode);

				});
				
				var $hiddenMessages = $(".message.hide");
				if ($hiddenMessages.length) {
					var $expander = $("<div id='messageExpander'>");
					$expander.append( $("<div id='messagesHidden'>").text(totalHiddenMessages) );
					$expander.click(function() {
						$("#openEmailProgress").addClass("visible");
						// timeout required to show progress bar
						setTimeout(function() {
							openEmail({mail:mail, expandMessages:true});
						}, mail.messages.length < 10 ? 1 : 200); // smaller then 10 messages then no timeout needed 
					});
					$hiddenMessages.first().before($expander);
				}

				// reply area
				var $replyArea = $("#replyArea");
				
				// reset
				$replyArea.attr("hidden", true);
				
				function initReply() {
					$replyArea
						.removeClass("clicked")
						.removeClass("sending")
						.removeClass("sendingComplete")
					;
					
					$replyArea.find("#send").text(getMessage("send"));
					$replyArea.find("#sendAndArchive").empty().append(getMessage("send") + " + ", $("<iron-icon icon='archive'>") );
					$replyArea.find("#sendAndDelete").empty().append(getMessage("send") + " + ", $("<iron-icon icon='delete'>") );
					
					getReplyTextArea().val("");

					var totalRecipients = 0;
					if (mail.messages.last().to) {
						totalRecipients += mail.messages.last().to.length;
					}
					if (mail.messages.last().cc) {
						totalRecipients += mail.messages.last().cc.length;
					}
					
					if (totalRecipients <= 1) {
						$replyArea.removeAttr("replyAll");
						$("#replyPlaceholder").text(getMessage("reply"));
					} else {
						console.log("show reply all")
						$replyArea.attr("replyAll", true);
						$("#replyPlaceholder").text(getMessage("replyToAll"));
					}
				}
				
				initReply();

				$replyArea.off().click(function() {
					console.log("replyTextarea clicked");
					if (!$replyArea.hasClass("clicked")) {
						$replyArea.addClass("clicked");
						getReplyTextArea().focus();
					}
				});

				// reply only to sender
				$("#replyOnlyToSender").off().click(function() {
					$replyArea.removeAttr("replyAll");
				});

				// reply only to sender
				$("#forward").off().click(function(event) {
					openMailInBrowser(mail, event);
					return false;
				});

				var replyObj;
				
				// MUST USE .off() for every event
				
				getReplyTextArea().off()
					.on("keyup", function(e) {
						resizeMessageHeight();
					})
					.on("keydown", function(e) {
						//console.log("keydown: ", e);
						if (isCtrlPressed(e) && e.keyCode == 13) {
							var $button;
							if (Settings.read("showSendAndArchiveButton")) {
								$button = $("#sendAndArchive");
							} else if (Settings.read("showSendAndDeleteButton")) {
								$button = $("#sendAndDelete");
							} else {
								$button = $("#send");
							}
							console.log("button focus click");
							
							$button
								.focus()
								.click()
							;
							return false;
						} else {
							return true;
						}
					})						
					.on("focus", {mail:mail}, function(e) {
						console.log("focus")
						
						if ($replyArea.attr("replyAll")) {
							replyObj = mail.generateReplyObject({replyAllFlag:true});
							console.log(replyObj);
							
							$("#replyTo").empty().append(getMessage("to") + " ");

							var firstTo = true;
							$.each(replyObj.tos, function(index, to) {
								if (!firstTo) {
									$("#replyTo").append(", ");
								}
								firstTo = false;
								$("#replyTo").append( pretifyRecipientDisplay(to, mail.account.getAddress()) );
							});
							
							$.each(replyObj.ccs, function(index, cc) {
								if (!firstTo) {
									$("#replyTo").append(", ");
								}
								firstTo = false;
								$("#replyTo").append( pretifyRecipientDisplay(cc, mail.account.getAddress()) );
							});
						} else {
							replyObj = mail.generateReplyObject();
							console.log("replyobj", replyObj);
							$("#replyTo").empty().append( getMessage("to") + " ", pretifyRecipientDisplay(replyObj.tos[0]) );
						}
						
						$replyArea.addClass("clicked");
						replyingToMail = mail;
						
						resizeMessageHeight();
						
						clearInterval(autoSaveInterval);
						autoSaveInterval = setInterval(function() {
							autoSave();
						}, seconds(3));
					})
					.on("blur", {mail:mail}, function(e) {
						console.log("blur", e);
						
						if (!$replyArea.hasClass("sendingComplete") && !getReplyTextArea().val()) {
							// if button is clicked inside reply area (ie Send) then don't reset reply area
							if (e.relatedTarget && e.relatedTarget.nodeName == "PAPER-BUTTON" && $(e.relatedTarget).closest("#replyArea").length) {
								// do nothing
							} else {
								initReply();
							}

							clearInterval(autoSaveInterval);
							autoSave();
						}
						
						resizeMessageHeight();
					})
				;
				
				if (Settings.read("showSendAndArchiveButton")) {
					$replyArea.find("#sendAndArchive").removeAttr("hidden");
				} else {
					$replyArea.find("#sendAndArchive").attr("hidden", true);
				}

				if (Settings.read("showSendAndDeleteButton")) {
					$replyArea.find("#sendAndDelete").removeAttr("hidden");
				} else {
					$replyArea.find("#sendAndDelete").attr("hidden", true);
				}

				$replyArea.find("#send, #sendAndArchive, #sendAndDelete").off().click(function(e) {
					// save this varirable because apparently e.data was being lost inside callback of .postReply just below??
					var $sendButtonClicked = $(this);
					var sendAndArchive = $sendButtonClicked.attr("id") == "sendAndArchive";
					var sendAndDelete = $sendButtonClicked.attr("id") == "sendAndDelete";
					
					var replyMessageText = getReplyTextArea().val();
					
					$replyArea.addClass("sending");
					
					// use Polymer.dom because in Firefox the paper-spinner was not instantianting
					Polymer.dom($sendButtonClicked[0]).innerHTML = "<paper-spinner class='white' active></paper-spinner>";
					
					var replyAllFlag = $replyArea.attr("replyAll");

					mail.postReply(replyMessageText, replyAllFlag).then(function(response) {
						$replyArea.removeClass("sending");
						
						if (sendAndArchive) {
							mail.archive();
						}
						
						if (sendAndDelete) {
							mail.deleteEmail();
						}
						
						// append message to top
						var newMessage = {};
						newMessage.alreadyRepliedTo = true;
						newMessage.from = {name:getMessage("me"), email:mail.account.getAddress()};
						newMessage.date = new Date();
						newMessage.to = replyObj.tos;
						newMessage.cc = replyObj.ccs;
						newMessage.textContent = replyMessageText;
						
						// htmltotext because we didn't want <script> or other tags going back into the content
						newMessage.content = convertPlainTextToInnerHtml(replyMessageText);
						
						mail.messages.push(newMessage);
						
						var $message = setMailMessage($openEmailMessages, mail, newMessage);
						
						$message.find(".contactPhoto").attr("src", $replyArea.find(".contactPhoto").attr("src"));

						resizeMessageHeight();
						
						// scroll to bottom
						getOpenEmailScrollTarget().scrollTop = getOpenEmailScrollTarget().scrollHeight;
						
						showMessage(getMessage("sent"));
						
						// this timeout MUST happen BEFORE the next timeout below for hiding the emails
						setTimeout(function() {
							// place this in a timeout to ensure autoSave is removed before it is added on blur event
							console.log("autoSave remove: " + new Date());
							clearInterval(autoSaveInterval);
							Settings.delete("autoSave");
						}, 200);

						setTimeout(function() {
							if (Settings.read("replyingMarksAsRead")) {
								if ($mail.hasClass("unread")) {
									var keepInInboxAsRead;
									var autoAdvance;
									if (sendAndArchive || sendAndDelete) {
										keepInInboxAsRead = false;
										autoAdvance = true;
									} else {
										keepInInboxAsRead = true;
										autoAdvance = false;
									}
									executeAction({mail:mail, action:"markAsRead", keepInInboxAsRead:keepInInboxAsRead, autoAdvance:autoAdvance});
									$("#markAsRead").attr("hidden", true);
									$("#markAsUnread").removeAttr("hidden");
								} else {
									if (sendAndArchive || sendAndDelete) {
										hideMail($mail, true);
									}
								}
							}
						}, 1000);
						
						initReply();
						
					}).catch(error => {
						$replyArea.removeClass("sending");
						$replyArea.find("#send").text(getMessage("send"));
						if (error && error.sessionExpired) {
							showError("There's a problem. Save your reply outside of this extension or try again.");
						} else {
							showError(error);
						}
					});
				});
				
				$replyArea.removeAttr("hidden");
				
				// need extra time especially when loading email via notification popup click
				setTimeout(function() {
					resizeMessageHeight();
				}, 100)

				// set message photo, use profile first, else use contacts
				var $imageNode = $replyArea.find(".contactPhoto");
				var profileInfo = mail.account.getSetting("profileInfo");
				if (profileInfo && profileInfo.image) {
					$imageNode.attr("src", profileInfo.image.url);
				} else {
					var contactPhotoParams = $.extend({}, {useNoPhoto:true, email:mail.account.getAddress()});
					contactPhotoParams.mail = mail;
					setContactPhoto(contactPhotoParams, $imageNode);
				}
			} else {
				// happens sometimes if a single message from the thread was deleted (ie. using "Delete this message" from dropdown on the right of message in Gmail)
				var error = "Problem retrieving message, this could happen if you deleted an individual message!";
				showError(error, {
					text:"Disable conversation view",
					onClick:function() {
						openUrl("https://jasonsavard.com/wiki/Conversation_View_issue?ref=problemRetrievingMessage");
					}
				});
				logError(error);
				reject(error);
			}
			
			// need just a 1ms timeout apparently so that transitions starts ie. core-animated-pages-transition-prepare before detecting it
			setTimeout(function() {
				// wait for certain events before processing message
				new Promise(function(resolve, reject) {
					// already there so let's process message
					setTimeout(function() {
						resolve();
					}, 300);
				}).then(function() {
					$(".message:not(.collapsed) .messageBody").each(function(index) {
						if (!$(this).data("processMessage")) {
							processMessage(mail, $(this), index);
						}
					});
					renderMoreAccountMails({mailsToRender:1});
				});
				
			},1 );
			
			$("#openEmailProgress").removeClass("visible");
		}).catch(function(error) {
			showError(error + ", please try again later!");
			logError("error in getThread: " + error);
			reject(error);
		});
		
		if (!initOpenEmailEventListenersLoaded) {
			initOpenEmailEventListeners();
		}
		
		$("#archive").attr("icon", mail.account.getSetting("openLinksToInboxByGmail") ? "check" : "archive");
		
		resolve();
		
	});		
}

function observe($node, className, processor) {
	if ($node) {
		var observer = new MutationObserver(function(mutations) {
			//console.log("mutation", mutations);
			mutations.forEach(function(mutation) {
				for (var a=0; a<mutation.addedNodes.length; a++) {
					if (mutation.addedNodes[a].className && mutation.addedNodes[a].className.hasWord && mutation.addedNodes[a].className.hasWord(className)) {
						processor(mutation.addedNodes[a]);
					}
				}
			});    
		});
		
		var config = { childList: true, subtree:true };
		observer.observe($node[0], config);
	}
}

function autoSave() {
	var $replyArea = $("#replyArea");
	var replyAll = $replyArea.attr("replyAll");
	var message = getReplyTextArea().val();
	if (message) {
		console.log("autosave set: " + new Date());
		Settings.store("autoSave", {mailId:replyingToMail.id, replyAll:replyAll, message:message});
	}
}

chrome.runtime.onConnect.addListener(function(port) {
	$(document).ready(function() {
		
		tabletFramePort = port;
		if (tabletFramePort.name == "popupWindowAndTabletFrameChannel") {
			console.log("onconnect")
			
			if (window.darkTheme) {
				tabletFramePort.postMessage({action: "invert"});
			}
			
			tabletFramePort.onMessage.addListener(function(message) {
				console.log("onMessage: " + message.action);
				if (message.action == "tabletViewUrlChanged") {
					Settings.store("tabletViewUrl", message.url);
					showSelectedTab(message.url);
				} else if (message.action == "getCurrentEmail") {
					console.log("current email in popup: " + message.email);
					if (message.email && message.email != currentTabletFrameEmail) {
						initTabs(message.email);
						currentTabletFrameEmail = message.email;
					}
				} else if (message.action == "reversePopupView") {
					reversePopupView();
				} else if (message.action == "openTabInBackground") {
					chrome.tabs.create({ url: message.url, active: false });
				}
			});
		}
		
	});
});

if (chrome.runtime.onMessage) {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.command == "profileLoaded") {
			refresh();
			showMessage(getMessage("profileLoaded"));
		} else if (message.command == "grantPermissionToContacts") {
			refresh();
			showMessage(getMessage("contactsLoaded"));
			niceAlert("You can also enable them in notifications:<br>Options > Notifications > Show Contact Photos");
		}
		sendResponse();
	});
}
	
if (chrome.runtime.onMessageExternal) {
	chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
		// MUST declare this same action "getEventDetails" in the backbround so that it does not sendresponse before we sendresponse here
		if (message.action == "getEventDetails") {
			var mail = getOpenEmail();
			if (mail) {
				var responseObj = {
						title: mail.title,
						description: mail.messages.last().content,
						url: mail.getUrl()
				}
				console.log("sendreponse", responseObj)
				sendResponse(responseObj);
			} else {
				// no details
				sendResponse();
			}
		}
	});
}
		
function showImages($node) {
	var html = $node.html();
	html = html.replace(/<imghidden/g, "<img");
	html = html.replace(/\/imghidden>/g, "/img>");
	$node.html( html );
}

function resetOpenEmailScrollTop() {
	getOpenEmailScrollTarget().scrollTop = 0;
}

function getInboxScrollTarget() {
	return $("#inboxSection app-header-layout app-header")[0].scrollTarget;
}

function getOpenEmailScrollTarget() {
	return $("#openEmailSection app-header-layout app-header")[0].scrollTarget;
}

function openInbox() {
	$(".page").removeClass("active");
	$("#inboxSection").addClass("active");

	// need a slight pause or else the render would not work
	setTimeout(function() {
		renderMoreAccountMails();
	}, 10);
	
	setTimeout(function() {
		resetOpenEmailScrollTop();
	}, 100)
}

function getMailNode(id) {
	var $node;
	
	$(".mail").each(function() {
		if ($(this).data("mail").id == id) {
			$node = $(this);
			return false;
		}
	});
	
	if (!$node) {
		// use $() to return empty jquery node if node is 
		$node = $();
	}
	return $node;
}

function getOpenEmail() {
	return $("#openEmail").data("mail");
}

function openPrevMail($mail) {
	console.log("openPrevMail");
	openOtherMail($mail, "prev");
}

function openNextMail($mail) {
	console.log("openNextMail");
	openOtherMail($mail, "next");
}

function openOtherMail($mail, direction) {
	console.log("openOtherMail");
	var $nextMail;
	var mailIndex = $mail.index(".mail");
	console.log("mailindex: " + mailIndex);
	
	if (direction == "prev" && mailIndex >= 1) {
		$nextMail = $(".mail").eq(mailIndex-1);
	} else if (direction == "next" && mailIndex+1 < $(".mail").length) {
		$nextMail = $(".mail").eq(mailIndex+1);
	}
	
	if ($nextMail && $mail.data("mail").account.id == $nextMail.data("mail").account.id) {
		var nextMail = $nextMail.data("mail");
		openEmail({mail:nextMail});
	} else {
		if (!$mail.hasClass("unread") && $(".mail").length == 1) {
			console.log("in autoAdvanceMail before close");
			openInbox();
			// commented because seems the closeWindow is called via hideMail
			// MAKE SURE to use a delay before closing window or CPU issue - maybe!
			//closeWindow({source:"openOtherMail", delay:seconds(2)});
		} else {
			openInbox();
		}
	}
}

//auto-advance - find newest email
function autoAdvanceMail($mail) {
	console.log("autoAdvanceMail");
	if (Settings.read("autoAdvance") == "newer") {
		openPrevMail($mail);
	} else if (Settings.read("autoAdvance") == "older") {
		openNextMail($mail);
	} else {
		openInbox();
	}
}

function refresh() {
	return new Promise((resolve, reject) => {
		showLoading();
		
		refreshAccounts().then(() => {
			resizePopup();
			setTimeout(function() {
				renderAccounts();
				// must resolve inside timeout because we need to make sure renderAccounts (which is synchronous) is run before
				resolve();
			}, 50);
			hideLoading();
		});
		
	});
}

function prepareMarkAllAsX($account, account, action) {
	var content;
	var tooManyAlternativeButton;
	var tooManyMarkAsX;
	if (action == "markAsDone") {
		content = getMessage("markAllAsDoneWarning");
		tooManyAlternativeButton = getMessage("markAllAsDone");
		tooManyMarkAsX = getMessage("markDone");
	} else if (action == "markAsRead") {
		content = getMessage("markAllAsReadWarning");
		tooManyAlternativeButton = getMessage("markAllAsReadTitle");
		tooManyMarkAsX = getMessage("readLinkTitle");
	}
	
	if (Settings.read("usedMarkAllAsReadButton")) {
		if (account.unreadCount > MAX_EMAILS_TO_ACTION) {
			var $dialog = initTemplate("tooManyActionsTemplate");
			$dialog.find("#tooManyActionsDescription").text(getMessage("tooManyUnread", MAX_EMAILS_TO_ACTION));
			$dialog.find(".tooManyAlternative").text(tooManyAlternativeButton);
			$dialog.find(".tooManyMarkAsX").text(tooManyMarkAsX + " (" + MAX_EMAILS_TO_ACTION + ")");
			openDialog($dialog).then(response => {
				if (response == "ok") {
					showLoading();
					bg.markAllAsX(account, action, closeWindow).then(() => {
						refresh();
					}).catch(error => {
						showError(error);
					});
				} else if (response == "cancel") {
					// nothing
				} else {
					openUrl("https://jasonsavard.com/wiki/Mark_all_unread_emails_as_read?ref=markAllAsReadDialog");
				}
			}).catch(error => {
				showError("error: " + error);
			});
		} else {
			showLoading();
			bg.markAllAsX(account, action, closeWindow).then(() => {
				refresh();
			}).catch(error => {
				showError(error);
			});
		}
	} else {
		openGenericDialog({
			title: "Warning",
			content: content,
			showCancel: true,
			okLabel: getMessage("continue")
		}).then(response => {
			if (response == "ok") {
				Settings.storeDate("usedMarkAllAsReadButton");
				if (action == "markAsDone") {
					$account.find(".markAllAsDoneButton").click();
				} else if (action == "markAsRead") {
					$account.find(".markAllAsReadButton").click();
				}
			}
		});
	}
}

function closeMenu(thisNode) {
	var node = $(thisNode).closest("paper-menu-button")[0];
	if (node) {
		node.close();
	}
}

function scrollAccountIntoView(accountDiv) {
	if (DetectClient.isFirefox()) {
		$("#inboxSection app-drawer-layout").animate({
			scrollTop: $(accountDiv).offset().top
		}, 100);
	} else {
		accountDiv.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
	}
}

function updateAccountHeaderColor(account, $account, newColor) {
	account.saveSetting("accountColor", newColor);
	
	$account.find(".accountHeader").css("background-color", newColor);
	
	var $accountAvatar = getAccountAvatar(account);
	setAccountAvatar($account, $accountAvatar);
}

function openComposeSection(params) {
	var voiceEmail = params.voiceEmail;
	var videoEmail = params.videoEmail;
	var account = params.account;
	
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
	
	if (Settings.read("accountAddingMethod") == "autoDetect") {
		openGenericDialog({
			content: "You must switch to the Add Accounts method to use this feature.",
			okLabel: getMessage("addAccount"),
			showCancel: true
		}).then(function(response) {
			if (response == "ok") {
				openUrl("options.html?ref=voiceEmailFromAutoDetectUser&highlight=addAccount#accounts");
			}
		});
		return;
	}
	
	$(".chip").remove();
	
	maxHeightOfPopup();
	
	var $composeSection = initTemplate("composeSectionTemplate");
	
	if (voiceEmail) {
		$(".recordSoundWrapper").show();
		$("#recordVideoWrapper").hide();
	} else {
		$(".recordSoundWrapper").hide();
		$("#recordVideoWrapper").hide();
	}
	
	$composeSection.off().click(function(e) {
		if (!$(e.target).closest(".acSuggestions").length) {
			console.log("Hiding suggestions because clicked away");
			$acSuggestions.hide();
		}
	})
	
	$("#composeBack").off().click(function() {
		// stop microphone and camera
		if (mediaStream) {
			mediaStream.getTracks().forEach(function(track) {
				track.stop();
			});
		}
		
		$(".page").removeClass("active");
		$("#inboxSection").addClass("active");
	});
	
	$(".contacts").off().click(function() {
		openUrl("https://contacts.google.com/u/" + account.id + "/");
	});

	$(".syncContacts").off().click(function() {
		showSaving();
		updateContacts().then(function() {
			showMessage(getMessage("done"));
		}).catch(error => {
			showError(error);
		}).then(function() {
			hideSaving();
		})
	});
	
	$composeSection.find(".close").off().click(function() {
		window.close();
	});

	function addChip($inputNode, $acSuggestions) {
		var $chip = $("<div class='chip layout horizontal center'><iron-image class='contactPhoto' sizing='cover' preload placeholder='/images/noPhoto.svg'></iron-image><span class='chipName'></span><iron-icon class='removeChip' icon='close'></iron-icon></div>");
		
		var name;
		var email;
		
		if ($acSuggestions.is(":visible") && $acSuggestions.find(".selected").length) {
			var chipData = $acSuggestions.find(".selected").data("data");
			name = chipData.name;
			email = chipData.email;
			$acSuggestions.hide();
		} else {
			email = $inputNode.val();
		}
		
		$chip.data("data", {name:name, email:email});
		
		var data = {account:account, name:name, email:email};
		setContactPhoto(data, $chip.find(".contactPhoto"));
		
		$chip.find(".chipName")
			.text(name ? name : email)
			.attr("title", email)
		;
		
		$chip.find(".removeChip").click(function() {
			$chip.remove();
			$("#composeTo").focus();
		});
		
		$(".chips").append($chip);
		$inputNode
			.val("")
			.attr("placeholder", "")
		;
	}
	
	var $fetchContacts = $("#fetchContacts");
	$fetchContacts.off().click(function() {
		bg.oAuthForContacts.openPermissionWindow(account.getAddress());
	});
	
	var MAX_SUGGESTIONS = 4;
	var MAX_SUGGESTIONS_BY_CLICK = 8;
	var performAutocomplete;
	var suggestions = [];
	var lastSuggestions = [];
	
	var $acSuggestions = $(".acSuggestions");
	var contacts = [];
	
	function addSuggestion(params) {
		var $acItem = $("<div class='acItem layout horizontal center'><iron-image class='contactPhoto' sizing='cover' preload placeholder='/images/noPhoto.svg'></iron-image><div class='acName'></div><div class='acEmail'></div></div>");
		
		$acItem
			.data("data", params)
			.mouseenter(function() {
				$acSuggestions.find(".selected").removeClass("selected");
				$(this).addClass("selected");
			})
			.mouseleave(function() {
				$(this).removeClass("selected");
			})
			.click(function() {
				addChip($("#composeTo"), $acSuggestions);
				$("#composeTo").focus();
			})
		;
		
		params.delay = 1; // I tried 100 before
		setContactPhoto(params, $acItem.find(".contactPhoto"));
		
		$acItem.find(".acName").text(params.name ? params.name : params.email.split("@")[0]);
		$acItem.find(".acEmail").text(params.email);
		$acSuggestions.append($acItem);
	}
	
	function showSuggestions() {
		suggestions.forEach(function(suggestion) {
			addSuggestion(suggestion);
		});
		lastSuggestions.forEach(function(suggestion) {
			addSuggestion(suggestion);
		});
		
		$acSuggestions.find(".acItem").first().addClass("selected");
		$acSuggestions.show();
	}
	
	function generateSuggestionDataFromContact(account, contact, emailIndex) {
		var email = contact.emails[emailIndex].address;
		var name = contact.name;
		var updated = contact.updatedDate;
		return { account: account, email: email, name: name, updated: updated };
	}
	
	// prefetch for speed
	getContacts({account:account}, function(response) {
		if (response.contacts) {
			contacts = response.contacts;
		}
	});
	
	$("#composeTo")
		.attr("placeholder", getMessage("to").capitalize())
		.off()
		.click(function() {
			suggestions = [];
			$acSuggestions.empty();
			contacts.every(function(contact, index) {
				if (index < MAX_SUGGESTIONS_BY_CLICK) {
					for (var b = 0; contact.emails && b < contact.emails.length; b++) {
						var suggestion = generateSuggestionDataFromContact(account, contact, b);
						if (contact.emails[b].primary) {
							suggestions.push(suggestion);
						}
					}
					return true;
				} else {
					return false;
				}
			});
			showSuggestions();
			return false;
		})
		.blur(function() {
			setTimeout(function() {
				$("#fetchContacts").hide();
			}, 200);
		})
		.keydown(function(e) {
			//console.log("keydown", e);
			if (e.keyCode == 9 || e.keyCode == 13) { // tab/enter
				if ($(this).val()) {
					addChip($(this), $acSuggestions);
					return false;
				}
				performAutocomplete = false;
			} else if (e.keyCode == 8) { // backspace
				if ($(this).val() == "") {
					$(".chips").find(".chip").last().remove();
					performAutocomplete = false;
				} else {
					performAutocomplete = true;
				}
			} else if (e.keyCode == 38) { // up
				var $current = $acSuggestions.find(".selected");
				var $prev = $current.prev();
				if ($prev.length) {
					$current.removeClass("selected");
					$prev.addClass("selected");
				}
				performAutocomplete = false;
				return false;
			} else if (e.keyCode == 40) { // down
				var $current = $acSuggestions.find(".selected");
				var $next = $current.next();
				if ($next.length) {
					$current.removeClass("selected");
					$next.addClass("selected");
				}
				performAutocomplete = false;
				return false;
			} else {
				performAutocomplete = true;
			}
		})
		.keyup(function(e) {
			//console.log("keyup", e);
			
			if (performAutocomplete) {
				if (contacts.length) {
					suggestions = [];
					lastSuggestions = [];
					$acSuggestions.empty();
					if ($(this).val()) {
						var firstnameRegex = new RegExp("^" + $(this).val(), "i");
						var lastnameRegex = new RegExp(" " + $(this).val(), "i");
						var emailRegex = new RegExp("^" + $(this).val(), "i");
						var matchedContacts = 0;
						for (var a=0; a<contacts.length; a++) {
							var contact = contacts[a];
							var firstnameFound = firstnameRegex.test(contact.name);
							var lastnameFound;
							if (!firstnameFound) {
								lastnameFound = lastnameRegex.test(contact.name);
							}
							if (firstnameFound || lastnameFound) {
								if (contact.emails && contact.emails.length) {
									//console.log("contact", contact);
									matchedContacts++;
									for (var b = 0; b < contact.emails.length; b++) {
										var suggestion = generateSuggestionDataFromContact(account, contact, b);
										if (contact.emails[b].primary && firstnameFound) {
											suggestions.push(suggestion);
										} else {
											lastSuggestions.push(suggestion);
										}
									}
								}
							} else {
								if (contact.emails && contact.emails.length) {
									for (var b = 0; b < contact.emails.length; b++) {
										if (emailRegex.test(contact.emails[b].address)) {
											//console.log("contact email", contact);
											matchedContacts++;
											var suggestion = generateSuggestionDataFromContact(account, contact, b);
											if (contact.emails[b].primary && contact.name) {
												suggestions.push(suggestion);
											} else {
												lastSuggestions.push(suggestion);
											}
										}
									}
								}
							}
							
							if (matchedContacts >= MAX_SUGGESTIONS) {
								break;
							}
						}
						
						showSuggestions();
					} else {
						$acSuggestions.hide();
					}
				} else {
					$fetchContacts.show();
				}
			}
		})
	;
	
	$("#composeSubject")
		.off()
		.prop("value", voiceEmail ? getMessage("voiceMessage") : getMessage("videoMessage"))
		.focus(function() {
			if ($("#composeTo").val()) {
				addChip($("#composeTo"), $acSuggestions);
			}
		})
	;
	
	if (params.skipAnimation) {
		$(".page").addClass("disableTransition");
	}

	$(".page").removeClass("active");
	$("#composeSection").addClass("active");

	// my page transitions bugged if focus on an input was set during animation
	$("#composeSection").one("transitionend", function(e) {
		$("#composeTo").focus();
		$(".page").removeClass("disableTransition");
	});

	var mediaStream;
	var mediaRecorder;
	var chunks = [];
	var blob;
	var base64Data;
	
	var recorder;
	
	var AUDIO_CONTENT_TYPE = "audio/wav";
	var VIDEO_CONTENT_TYPE = "video/webm";
	
	var videoMimeTypeAndCodec;
	
	var $recordSoundWrapper = $(".recordSoundWrapper");
	var $recordSoundButton = $("#recordSoundButton");
	
	function ensureRecordingIsSaved(params) {
		console.log("ensureRecordingIsSaved");

		params = initUndefinedObject(params);
		
		return new Promise(function(resolve, reject) {
			
			if (voiceEmail) {
				if ($recordSoundWrapper.hasClass("recording")) {
					
					recorder.stop();
					
					recorder.exportWAV(function(blobFromExport) {
						blob = blobFromExport;
						blobToBase64(blob).then(function(response) {
							
							$recordSoundWrapper.find("source").attr("type", AUDIO_CONTENT_TYPE);
							$recordSoundWrapper.find("source")[0].src = response;
							
							base64Data = response;
							
							$recordSoundWrapper.removeClass("recording");
							$recordSoundWrapper.addClass("recordedSound");
							
							if (params.autoplay !== false) {
								$recordSoundWrapper.find("audio")[0].load();
								$recordSoundWrapper.find("audio")[0].play();
							}
							resolve();
							
						}).catch(error => {
							reject(error);
						});
					}, AUDIO_CONTENT_TYPE, 44100);
				} else {
					resolve();
				}
			} else {
				if ($recordVideoWrapper.hasClass("recording")) {
					
					mediaRecorder.stop();
					
					mediaRecorder.onstop = function(e) {
					
						blob = new Blob(chunks, { 'type' : VIDEO_CONTENT_TYPE });
				        video.muted = false;
						video.src = window.URL.createObjectURL(blob);

				        $(video)
				        	.off()
				        	.click(function() {
				        		if (video.paused == false) {
				        			video.pause();
				        		} else {
				        			video.play();
				        		}
				        	})
				        	.on("playing", function() {
				        		if (!$recordVideoWrapper.hasClass("recording")) {
				        			$recordVideoWrapper.addClass("playing");
				        		}
				        	})
				        	.on("pause ended", function() {
				        		$recordVideoWrapper.removeClass("playing");
				        	})
				        	.mouseenter(function() {
				        		video.controls = true;
				        	})
				        	.mouseleave(function() {
				        		video.controls = false;
				        	})
				        ;
				        
			        	video.controls = true;

			        	blobToBase64(blob).then(function(response) {
			        		base64Data = response;
					        $recordVideoWrapper.removeClass("recording");
					        $recordVideoWrapper.addClass("recordedVideo");
					        resolve();
						}).catch(error => {
							reject(error);
						});
			        	
				    }
				} else {
					resolve();
				}
			}
			
		});
	}
	
	// Video stuff
	var $recordVideoWrapper = $("#recordVideoWrapper");
	var $recordVideoButton = $("#recordVideoButton");
	var mediaRecorder;
	var chunks;
	var video = $("#video")[0];
	
	/*
	navigator.mediaDevices.enumerateDevices().then(function(response) {
		console.log("devices", response);
	});
	*/
	
	var userMediaParams = {};
	if (voiceEmail) {
		userMediaParams.audio = true;
	} else {
		userMediaParams.audio = true;
		userMediaParams.video = { facingMode: "user" };
	}
	
	navigator.mediaDevices.getUserMedia(userMediaParams).then(stream => {
		mediaStream = stream;
		
		if (voiceEmail) {
			$recordSoundButton.off().on("click", function() {
				if ($recordSoundWrapper.hasClass("recording")) {
					ensureRecordingIsSaved().catch(function(error) {
						showError(error);
					});
				} else {
					var audio_context = new AudioContext;
					var input = audio_context.createMediaStreamSource(mediaStream);
				    // Uncomment if you want the audio to feedback directly
				    //input.connect(audio_context.destination);
				    //__log('Input connected to audio context destination.');
				    recorder = new Recorder(input, {numChannels:1}); // bufferLen: 1024, 
				    recorder.record();
					
					$recordSoundWrapper.addClass("recording");
				}
			});
		} else {
			// Video
			function initVideoStream() {
			    $recordVideoWrapper.removeClass("recordedVideo");
				
				video.src = URL.createObjectURL(stream);
				video.muted = true;
				video.controls = false;
				video.play();
			}

			initVideoStream();
	        $(video)
	        	.off()
	        	.on("canplay", function() {
	        		$("#recordVideoWrapper").show();
	        	})
	        	.on("click", function() {
	        		$recordVideoButton.click();
	        	})
	        ;
			
			$recordVideoButton.off().click(function() {
				if ($recordVideoWrapper.hasClass("recording")) {
					ensureRecordingIsSaved({autoplay:false}).then(function() {
						// nothing
					}).catch(function(error) {
						showError(error);
					});
				} else {
					initVideoStream();
				    
					chunks = [];
					
					/*
					videoMimeTypeAndCodec = VIDEO_CONTENT_TYPE + ";codecs=vp9,opus"; // codes=vp9 was very slow while recording
					if (!MediaRecorder.isTypeSupported(videoMimeTypeAndCodec)) {
						videoMimeTypeAndCodec = VIDEO_CONTENT_TYPE + ";codecs=vp9";
						if (!MediaRecorder.isTypeSupported(videoMimeTypeAndCodec)) {
							videoMimeTypeAndCodec = VIDEO_CONTENT_TYPE;
						}
					}
					*/
					
					var options = {mimeType : VIDEO_CONTENT_TYPE}
					mediaRecorder = new MediaRecorder(stream, options);
					mediaRecorder.start();
					mediaRecorder.ondataavailable = function(e) {
						chunks.push(e.data);
					}
					mediaRecorder.onwarning = function(e) {
					    console.warn('mediarecord wraning: ' + e);
					};
					mediaRecorder.onerror = function(e) {
						console.error('mediarecord error: ' + e);
						throw e;
					};
				    
				    $recordVideoWrapper.addClass("recording");
				}
			});
		}
		
	}).catch(error => {
		console.log(error);
		if (error.name == "PermissionDismissedError") {
			openGenericDialog({
				content: "You must grant access to use this feature.",
				okLabel: getMessage("grantAccess"),
				showCancel: true
			}).then(function(response) {
				if (response == "ok") {
					location.reload();
				}
			});
		} else if (error.name == "PermissionDeniedError") {
			if (isDetached) {
				if (location.href.indexOf("action=getUserMediaDenied") != -1 || location.href.indexOf("action=getUserMediaFailed") != -1) {
					openGenericDialog({
						title: "You must grant access to use this feature",
						content: "Click the <iron-icon style='color:#aaa' icon='av:videocam'></iron-icon> icon <i>(On the right of the address bar near the star)</i><br>Select <b>Always allow ... </b> and reload the page."
					}).then(function(response) {
						if (response == "ok") {
							$($recordSoundButton).add($recordVideoButton).off().click(function() {
								openGenericDialog({
									content: "I assume you granted access now let's refresh the page",
									okLabel: getMessage("refresh")
								}).then(function(response) {
									if (response == "ok") {
										location.reload();
									}
								});
							});
						}
					});
				}
			} else {
				openUrl(getPopupFile() + "?action=getUserMediaDenied&mediaType=" + (voiceEmail ? "voiceEmail" : "videoEmail") + "&accountEmail=" + encodeURIComponent(account.getAddress()));
			}
		} else if (error.name == "MediaDeviceFailedDueToShutdown") {
			//openWindowInCenter(getPopupFile() + "?action=getUserMediaFailed&mediaType=" + (voiceEmail ? "voiceEmail" : "videoEmail") + "&accountEmail=" + encodeURIComponent(account.getAddress()), '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes', Settings.read("popupWidth"), Settings.read("popupHeight"));
			openUrl(getPopupFile() + "?action=getUserMediaDenied&mediaType=" + (voiceEmail ? "voiceEmail" : "videoEmail") + "&accountEmail=" + encodeURIComponent(account.getAddress()));
		} else {
			showError(error.name);
		}
	});
	
	function resetSending() {
		$("#composeSection").removeClass("sending");
		$("#sendComposeEmail").replaceWith( $("<paper-button id='sendComposeEmail' class='colored sendButton' raised>").text(getMessage("send")) );
	}
	
	resetSending();
	
	$("#sendComposeEmail")
		.off()
		.click(function() {
			if ($("#composeTo").val()) {
				addChip($("#composeTo"), $acSuggestions);
			}
			
			var tos = [];
			$(".chip").each(function() {
				tos.push( $(this).data("data") );
			});
			
			if (tos.length == 0) {
				openGenericDialog({
					content: "Please specify at least one recipient."
				});
				return;
			}
			
			if (((voiceEmail && !$recordSoundWrapper.hasClass("recording")) || (videoEmail && !$recordVideoWrapper.hasClass("recording"))) && !base64Data) {
				openGenericDialog({
					content: "You forgot to record a message."
				});
				return;
			}

			$("#composeSection").addClass("sending");
			Polymer.dom(this).innerHTML = "<paper-spinner class='white' active></paper-spinner>";

			ensureRecordingIsSaved({autoplay:false}).then(function() {
				var sendEmailParams = {};
				sendEmailParams.account = account;
				if (Settings.read("donationClicked")) {
					sendEmailParams.tos = tos;
				} else {
					sendEmailParams.tos = [{email:account.getAddress()}];
				}
				sendEmailParams.subject = $("#composeSubject").val();
				
				sendEmailParams.htmlMessage = "";
				sendEmailParams.htmlMessage += "<span style='color:gray;font-size:90%'>To play this message:<br>Download file > Select a program > Choose <b>Google Chrome</b> or any other browser. <a href='https://jasonsavard.com/wiki/Opening_email_attachments?ref=havingTrouble'>Having trouble?</a></span><br><br>";
				sendEmailParams.htmlMessage += "Sent via Checker Plus for Gmail";
				
				sendEmailParams.attachment = {};
				sendEmailParams.attachment.filename = voiceEmail ? VOICE_MESSAGE_FILENAME_PREFIX + ".wav" : VIDEO_MESSAGE_FILENAME_PREFIX + ".webm";
				sendEmailParams.attachment.contentType = voiceEmail ? AUDIO_CONTENT_TYPE : VIDEO_CONTENT_TYPE;
				sendEmailParams.attachment.data = base64Data.split("base64,")[1];
				if (voiceEmail) {
					sendEmailParams.attachment.duration = parseFloat($recordSoundWrapper.find("audio")[0].duration).toFixed(2);
				}
				
				sendGA('sendAttachment', 'start');
				
				if (!Settings.read("donationClicked") && Settings.read("_sendAttachmentTested")) {
					openContributeDialog("sendAttachment", true);
					resetSending();
				} else {
					// insert slight delay because seems sendEmail bottlenecks when sending large attachments
					setTimeout(function() {
						account.sendEmail(sendEmailParams).then(function() {
							showMessage("Sent");
							
							if (!Settings.read("donationClicked")) {
								openContributeDialog("sendAttachment", true, "<i style='color:gray'>For testing this message will be sent to yourself at " + account.getAddress() + "</i>");
							}
							
							Settings.storeDate("_sendAttachmentTested");
							setTimeout(function() {
								$("#composeBack").click();
							}, 1200);
							sendGA('sendAttachment', 'success');
						}).catch(function(error) {
							openGenericDialog({
								title: error,
								content: "There was problem sending the email. Don't worry you can still download the message and attach it yourself in Gmail",
								okLabel: getMessage("download"),
								showCancel: true
							}).then(function(response) {
								if (response == "ok") {
									var url = window.URL.createObjectURL(blob);
						            var link = window.document.createElement('a');
						            link.href = url;
						            link.download = sendEmailParams.attachment.filename;
						            var click = document.createEvent("Event");
						            click.initEvent("click", true, true);
						            link.dispatchEvent(click);
								}
							});
							sendGA('sendAttachment', 'error', error);
						}).then(function() {
							resetSending();
						});					
					}, 1);
				}
			}).catch(function(error) {
				resetSending();
				showError(error);
			});
		})
	;
}

function renderAccounts() {
	var $inbox = $("#inbox");
	
	$inbox.find(".account").remove();
	$(".accountAvatar").remove();
	
	var mailNodesAdded = 0;
	var activeAccounts = getActiveAccounts(accounts);
	
	var accountAvatarTemplate = $("#accountAvatarTemplate")[0];
	var $accountAvatars = $("#accountAvatars");
	
	activeAccounts.forEach(function(account, accountIndex, thisArray) {
		
		if (accountIndex != 0 && accountIndex == (thisArray.length-1) && !account.hasBeenIdentified()) {
			console.error("has not been identified: " + account.getAddress());
		} else {
			var accountTemplate = document.querySelector('#accountTemplate');
			
			// patch for https://github.com/PolymerElements/paper-menu-button/issues/8
			/*
			var paperMenuButton = accountTemplate.content.querySelector("paper-menu-button");
			if (paperMenuButton && paperMenuButton.getAttribute("msgHALIGN") == "right") {
				var position = getMessage("dir") == "rtl" ? "left" : "right";
				paperMenuButton.setAttribute("horizontal-align", position);
			}
			*/
			
			var accountNode = document.importNode(accountTemplate.content, true);
			
			$inbox.append(accountNode);
			var $account = $inbox.find(".account").last();
			
			initMessages($account.find("*"));
			
			$account.attr("email", account.getAddress());
			$account.data("account", account);
			
			var $accountErrorWrapper = $account.find(".accountErrorWrapper");
			//account.error = JError.ACCESS_REVOKED;
			if (account.error) {
				$accountErrorWrapper.removeAttr("hidden");
				$accountErrorWrapper.find(".accountError")
					.empty().append(account.getError().niceError + " ", account.getError(true, document).$instructions)
					.attr("title", account.getError().niceError)
				;
				$accountErrorWrapper.find(".refreshAccount").click(function() {
					refresh();
				});
			} else {
				$accountErrorWrapper.attr("hidden", true);
			}
			
			$account.find(".accountHeader").css("background-color", account.getSetting("accountColor"));
			
			$account.find(".accountTitleArea")
				.attr("title", getMessage("open"))
				.click(function(event) {
					var openParams = {};
					if (isCtrlPressed(event) || event.which == 2) {
						openParams.openInBackground = true;
					}
					account.openInbox(openParams);
					closeWindow({source:"accountTitleArea"});
				})
			;
			
			$account.find(".accountTitle").text(account.getEmailDisplayName());
			
			if (account.getSetting("openLinksToInboxByGmail")) {
				$account.find(".markAllAsReadButton").attr("hidden", "");
				$account.find(".markAllAsDoneButton")
					.removeAttr("hidden")
					.click(function() {
						prepareMarkAllAsX($account, account, "markAsDone");
					})
				;
			} else {
				$account.find(".markAllAsReadButton")
					.click(function() {
						prepareMarkAllAsX($account, account, "markAsRead");
					})
				;
			}

			$account.find(".compose")
				.click(function() {
					// new: uing transport: 'beacon' ensures the data is sent even if window closes, old: using bg. because open compose closes this window and compose wasn't being registered in time
					sendGA('accountBar', 'compose', {transport: 'beacon'});
					account.openCompose();
					closeWindow();
				})
			;
			
			$account.find(".voiceEmail")
				.click(function() {
					openComposeSection({voiceEmail:true, account:account});
					sendGA('accountBar', 'voiceEmail');
				})
			;

			$account.find(".videoEmail")
				.click(function() {
					openComposeSection({videoEmail:true, account:account});
					sendGA('accountBar', 'videoEmail');
				})
			;

			$account.find(".search")
				.click(function() {
					$("html").addClass("searchInputVisible");
					$("#searchInput")
						.data("account", account)
						.focus()
					;
				})
			;
			
			$account.find(".accountOptionsMenuButton")
				.one("mousedown", function() { // MUST use .one because mousedown will also be called when menu items *inside the dropdown all are also clicked
					
					$(this).closest(".accountHeader").removeClass("sticky");
					
					maxHeightOfPopup();
					var $accountOptions = initTemplate($(this).find(".accountOptionsMenuItemsTemplate"));
					
					$account.find(".markAllAsReadButton")
						.attr("title", getMessage("markAllAsRead"))
					;
					
					$account.find(".markAllAsRead")
						.click(function(event) {
							closeMenu(this);
							prepareMarkAllAsX($account, account, "markAsRead");
						;
					});
					
					$account.find(".sendPageLink")
						.click(function(event) {
							getActiveTab().then((tab) => {
								sendGA("inboxLabelArea", "sendPageLink");
								sendPageLink(null, tab, account);
								closeWindow({source:"sendPageLink"});
							});
						;
					});
	
					$account.find(".contacts")
						.click(function() {
							openUrl("https://contacts.google.com/u/" + account.id + "/");
						})
					;

					$account.find(".copyEmailAddress")
						.click(function() {
							$("#hiddenText")
								.val(account.getAddress())
								.focus()
								.select()
							;
							document.execCommand('Copy');
							showMessage(getMessage("done"));
							closeMenu(this);
						})
					;
	
					function updateAlias(alias) {
						account.saveSetting("alias", alias);
						$account.find(".accountTitle").text(account.getEmailDisplayName());
					}
					
					$account.find(".alias")
						.click(function() {
							closeMenu(this);
							if (donationClicked("alias")) {
								var $dialog = initTemplate("aliasDialogTemplate");
								$dialog.find("#newAlias")
									.off()
									.attr("value", account.getEmailDisplayName())
									.keypress(function(e) {
										if (e.keyCode == 13) {
											updateAlias($dialog.find("#newAlias")[0].value);
											$dialog[0].close();
										}
									})
								;
								openDialog($dialog).then(function(response) {
									if (response == "ok") {
										updateAlias($dialog.find("#newAlias")[0].value);
									}
								}).catch(function(error) {
									showError("error: " + error);
								});
							}
						})
					;
					$account.find(".colors")
						.click(function() {
							closeMenu(this);
							if (donationClicked("colors")) {
								var $dialog = initTemplate("colorPickerDialogTemplate");
								$dialog.find("paper-swatch-picker")
									.attr("color", account.getSetting("accountColor"))
									.off().on("color-changed", e => {
										let color = e.originalEvent.detail.value;
										updateAccountHeaderColor(account, $account, color);
									})
								;
								openDialog($dialog);
							}
						})
					;
					
					var profileInfo = account.getSetting("profileInfo");
					if (profileInfo) {
						$account.find(".setAccountIcon")
							.click(function() {
								account.deleteSetting("profileInfo");
								refresh();
							})
						;
						// little tricky here because we process the [msg] nodes with a call initMessages way below we must change the msg here or else it will be overwritten later
						$account.find(".setAccountIconLabel").attr("msg", "removeAccountIcon");
					} else {
						$account.find(".setAccountIcon")
							.click(function() {
								closeMenu(this);
								if (donationClicked("setAccountIcon")) {
									bg.emailAccountRequestingOauth = account.getAddress();
									bg.oAuthForProfiles.openPermissionWindow(account.getAddress());
								}
							})
						;
					}
					
					$account.find(".showContactPhotos")
						.click(function() {
							closeMenu(this);
							bg.oAuthForContacts.openPermissionWindow(account.getAddress());
						})
					;
					$account.find(".openInboxInsteadOfGmail")
						.click(function() {
							closeMenu(this);
							var $dialog = initTemplate("inboxByGmailDialogTemplate");
							openDialog($dialog).then(function(response) {
								if (response == "ok") {
									account.saveSetting("openLinksToInboxByGmail", true).catch(error => {
										showError(error);
									});
								} else if (response == "other") {
									openUrl("https://jasonsavard.com/wiki/Inbox_by_Gmail?ref=GmailAccountOptions");
								}
							});
						})
					;
					$account.find(".openGmailInsteadOfInbox")
						.click(function() {
							closeMenu(this);
							account.saveSetting("openLinksToInboxByGmail", false);
						})
					;
					
					if (account.getSetting("openLinksToInboxByGmail")) {
						$account.find(".openInboxInsteadOfGmail").hide();
					} else {
						$account.find(".openGmailInsteadOfInbox").hide();
					}
					
					if (accounts.length <= 1) {
						$account.find(".ignore").hide();
					} else {
						$account.find(".ignoreAccountText").text( Settings.read("accountAddingMethod") == "autoDetect" ? getMessage("ignoreThisAccount") : getMessage("removeAccount") );
						$account.find(".ignore").show();
					}
					$account.find(".ignore")
						.click(function() {
							showLoading();
							account.remove(bg.oAuthForEmails, bg.accounts);
							
							bg.pollAccounts({showNotification:true}).then(function() {
								//if (Settings.read("accountAddingMethod") == "autoDetect") {
									location.reload();
								//}
							}).catch(error => {
								showError(error);
							}).then(() => {
								hideLoading();
							});
						})
					;
					$account.find(".accountOptions")
						.click(function() {
							openUrl("options.html?ref=accountOptions&accountEmail=" + encodeURIComponent(account.getAddress()) + "#accounts")
						})
					;
				
					// must be last
					initMessages(".accountOptionsMenu *");

				})
			;
			
			renderMails({$account:$account});

			// avatars
			var accountAvatarNode = document.importNode(accountAvatarTemplate.content, true);
			$accountAvatars.append(accountAvatarNode);
			var $accountAvatar = $accountAvatars.find(".accountAvatar").last();
			
			$accountAvatar
				.data("account", account)
				.attr("title", account.getEmailDisplayName())
			;
			
			setAccountAvatar($account, $accountAvatar);
			// must be done after avatar to update avatar count
			setUnreadCountLabels($account);

			$accountAvatar.click(function() {
				if (popupView == POPUP_VIEW_CHECKER_PLUS) {
					showSaving();
					setTimeout(function() {
						renderMoreAccountMails({renderAll:true});
						scrollAccountIntoView($account[0]);
						hideSaving();
					}, 50);
				} else {
					if (Settings.firstTime("onlyCheckerPlusSupportsClickToScroll")) {
						openGenericDialog({
							content: "Only the Checker Plus view supports click to scroll to account",
							okLabel: getMessage("switchToCheckerPlus"),
							showCancel: true
						}).then(response => {
							if (response == "ok") {
								reversePopupView(true);
								renderMoreAccountMails();
							}
						});
					} else {
						reversePopupView(true);
						renderMoreAccountMails({ renderAll: true });
						setTimeout(() => {
							scrollAccountIntoView($account[0]);
						}, 10);
					}
				}
			});
		}
	});
	
	// used to keep a skeleton scrollbar (windows only) there so the action buttons don't shift when the scrollbar normally disappear
	setTimeout(function() {
		if ($(getInboxScrollTarget()).hasVerticalScrollbar(8)) {
			$("#inboxSection").addClass("hasVerticalScrollbars");
		}
	}, 1)

	setContactPhotos(activeAccounts, $(".mail"));
}

function showUndo(params) {
	return new Promise((resolve, reject) => {
		if (params.$mail && params.$mail.offset().top >= $(window).height() - 120) {
			$("#undoToast").attr("vertical-align", "top");
		} else {
			$("#undoToast").attr("vertical-align", "bottom");
		}
		showToast({toastId:"undoToast", duration:5, text:params.text, actionParams:{
				onClick: function() {
					clearTimeout(closeWindowTimeout);
					showLoading();
					params.mail[params.undoAction]().then(response => {
						var hiddenMailIndex = hiddenMails.indexOf(params.mail.id);
						if (hiddenMailIndex != -1) {
							hiddenMails.splice(hiddenMailIndex, 1);
						}
						
						if (params.undoAction == "untrash" && Settings.read("accountAddingMethod") == "oauth") {
							// seems the polling logic would not resurface the deleted email so had to delete historyid
							params.mail.account.reset();
						}
						
						refresh().then(function() {
							resolve();
						});
						
						hideLoading();
					});
				}
			}
		});
	});
}

function initInboxMailActionButtons($mail) {
	if ($mail.length) {
		var mail = $mail.data("mail");
		var account = mail.account;
		
		// paper-icon-button were slow to initially load so decided to dynamically load them via template and mouseover
		var $inboxMailActionButtonsTemplate = $mail.find(".inboxMailActionButtonsTemplate");
		if ($inboxMailActionButtonsTemplate.length) {
			initTemplate($inboxMailActionButtonsTemplate);
			
			$mail.find(".archive")
				.attr("title", getMessage("archiveLink"))
				.attr("icon", account.getSetting("openLinksToInboxByGmail") ? "check" : "archive")
				.click(function() {
					executeAction({mail:mail, action:"archive"});
					return false;
			});

			$mail.find(".markAsSpam")
				.attr("title", getMessage("spamLinkTitle"))
				.click(function() {
					executeAction({mail:mail, action:"markAsSpam"});
					return false;
			});

			$mail.find(".delete")
				.attr("title", getMessage("delete"))
				.click(function() {
					executeAction({mail:mail, action:"deleteEmail"});
					showUndo({mail:mail, text:getMessage("movedToTrash"), undoAction:"untrash"});
					return false;
			});
			
			$mail.find(".markAsRead")
				.attr("title", getMessage("readLinkTitle"))
				.click(function() {
					executeAction({mail:mail, action:"markAsRead"});
					var text = account.getSetting("openLinksToInboxByGmail") ? getMessage("markedAsDone") : getMessage("markedAsRead");
					showUndo({$mail:$mail, mail:mail, text:text, undoAction:"markAsUnread"});
					return false;
			});

			$mail.find(".markAsUnread")
				.attr("title", getMessage("unreadLinkTitle"))
				.click(function() {
					mail.markAsUnread();
					$mail.addClass("unread");
					updateUnreadCount(+1, $mail);
					return false;
			});

			$mail.find(".reply")
				.attr("title", getMessage("reply"))
				.click(function(event) {
					mail.reply();
					setTimeout(function() {
						window.close();
					}, 100);
					return false;
			});

			$mail.find(".openMail")
				.attr("title", getMessage("openGmailTab"))
				.click(function(event) {
					openMailInBrowser(mail, event);
					return false;
			});
		}
	}
}

function renderMails(params) {
	var $account = params.$account;
	var maxIssuedDate = params.maxIssuedDate;

	// Load mails
	var account = $account.data("account");
	var mails = account.getMail().slice(0);
	
	mails.sort(function (a, b) {
	   if (a.issued > b.issued)
		   return -1;
	   if (a.issued < b.issued)
		   return 1;
	   return 0;
	});
	
	var mailTemplate = $account.find(".mailTemplate")[0];
	var $mails = $account.find(".mails");
	
	var mailNodesBelowFold = 0;
	var newlyRenderedMails = 0;
	
	if (skinsSettings) {
		window.buttonsAlwaysShow = skinsSettings.some(function(skin) {
			// [Buttons] Always show
			if (skin.id == 29) {
				return true;
			}
		});
		window.darkTheme = skinsSettings.some(function(skin) {
			if (skin.id == 4) {
				return true;
			}
		});
	}
	
	var existingMailsCount = $(".mail").length;
	
	console.time("renderMails");
	mails.some(function(mail, mailIndex) {
		if (hiddenMails.indexOf(mail.id) != -1) {
			console.log("exclude: " + mail.title);
			return false;
		}
		
		var $lastMail = $(".mail").last();
		if ($lastMail.length && !isVisibleInScrollArea($lastMail, $("#inbox"), existingMailsCount + mailIndex)) {
			mailNodesBelowFold++;
		}
		
		// skip mails that have newer then the max issued date
		if (maxIssuedDate && mail.issued >= maxIssuedDate) {
			// same as "continue" ie. to skip this mail
			return false;
		} else if (mailNodesBelowFold >= 2) { // if 1 or more mail are below fold (ie. not visible) then stop loading the rendering the rest; do it later so that popup loads initially faster
			if (params.renderAll) {
				// just continue below
			} else if (params.mailsToRender) {
				if (newlyRenderedMails >= params.mailsToRender) {
					// we can break out now
					console.log("newlyRenderedMails >= params.mailsToRender");
					return true;
				} else {
					// just continue
				}
			} else {
				console.log("below fold: " + mailNodesBelowFold);
				return true;
			}
		} else {
			console.log("mail", mail.title + " " + maxIssuedDate + " " + mail.issued);
		}
		
		if (!params.showMore && mailIndex+1 > Settings.read("maxEmailsToShowPerAccount")) {
			if (!$mails.find(".showMoreEmails").length) {
				var $showMoreEmails = $("<div class='showMoreEmails' title='Show more emails'><paper-icon-button icon='expand-more'></paper-icon-button></div>");
				$showMoreEmails.click(function() {
					$(this).remove();
					params.showMore = true;
					params.mailsToRender = 20;
					renderMoreMails(params);
				});
				$mails.append( $showMoreEmails );
			}
			return true;
		}
		
		newlyRenderedMails++;
		
		var mailNode = document.importNode(mailTemplate.content, true);

		$mails.append(mailNode);
		
		var $mail = $mails.find(".mail").last();
		$mail.data("mail", mail);
		
		// sender
		var sender = mail.generateAuthorsNode();
		if (!sender) {
			sender = getMessage("unknownSender");
		}
		
		$mail.find(".sender").empty().append(sender);
		
		$mail.find(".date").text(mail.getDate());
		
		if (mail.issued) {
			$mail.find(".date").attr("title", mail.issued);
		}
		
		$mail.find(".subject").text(mail.title);
		
		// snippet
		var maxSummaryLetters;
		
		if ($mail.width() == 0) { // sometimes happens then use default
			maxSummaryLetters = 180;
		} else {
			maxSummaryLetters = $mail.width() / (drawerIsVisible ? 4.2 : 4);
		}
		
		var $EOM_Message = $("<span class='eom'></span>");
		$EOM_Message
			.attr("title", getMessage("EOMToolTip"))
			.text("[" + getMessage("EOM") + "]")
		;
		
		mail.getLastMessageText({maxSummaryLetters:maxSummaryLetters, htmlToText:true, targetNode:$mail.find(".snippet"), EOM_Message:$EOM_Message});
		
		// labels
		var labelsTemplate = $mail.find(".labelsTemplate")[0];
		var $labels = $mail.find(".labels");
		
		if (labelsTemplate && labelsTemplate.content) {
			var labels = mail.getDisplayLabels(true);
			labels.forEach(function(labelObj) {
				//console.log("label", labelObj);
				var labelNode = document.importNode(labelsTemplate.content, true);
				$labels.append(labelNode);
				var $label = $labels.find(".label").last();
				$label.data("label", labelObj);
				$label.find(".labelName").text(labelObj.name);
			});
		}
		
		initStar($mail.find(".star"), mail);
		
		if (buttonsAlwaysShow) {
			initInboxMailActionButtons($mail);
		}
		
		// click
		$mail
			.click(function(event) {
				if (Settings.read("emailPreview") && !isCtrlPressed(event)) {
					// ** for auto-detect only because i think oauth already fills up .messages: openEmail must be called atleast once to generate the messages! for them to appear
					openEmail({mail:mail});
				} else {
					openMailInBrowser(mail, event);
					return false;
				}
			})
			.mouseenter(function() {
				if (!buttonsAlwaysShow) {
					initInboxMailActionButtons($mail);
				}
			})
		;
		
	});
	
	console.timeEnd("renderMails");
}

function isVisibleInScrollArea($node, $scroll, mailIndex) {
    // patch seems firefox was not returning :visible on scroll or Y value for newly rendered nodes
    if (DetectClient.isFirefox()) {
    	return true;
    } else {
		var vpH = getInboxViewportHeight(), // Viewport Height
			//st = $scroll[0].scroller.scrollTop,
			//st = $scroll.scrollTop(), // Scroll Top
			y = $node.position().top;// + getInboxTop();
		console.info($scroll.is(":visible") + " y: " + y + " vph: " + vpH);
		// when machine is slow it seems visible == false and y == 0
		// commented: also included vpH <= 0 refer to bug https://jasonsavard.com/forum/discussion/comment/15849#Comment_15849
    	return (!$scroll.is(":visible") && y == 0) || $scroll.is(":visible") && y < vpH;
    }
}

function renderMoreAccountMails(params) {
	console.log("renderMoreAccountMails");
	params = initUndefinedObject(params);
	$(".account").each(function() {
		params.$account = $(this);
		renderMoreMails(params);
	});
}

function renderMoreMails(params) {
	var maxIssuedDate;
	var $lastMail = params.$account.find(".mail").last();
	if ($lastMail.length) {
		maxIssuedDate = $lastMail.data("mail").issued;
	}
	
	params.maxIssuedDate = maxIssuedDate;

	renderMails(params);
	setContactPhotos(accounts, $(".mail"));
}

function getInboxTop() {
	// because inbox is inside paper-header-panel [main] so the inbox.top can be negative so we must add the scrollTop of paper-headerpanel
	return $("#inbox").offset().top; // + $("[main]")[0].scroller.scrollTop;
}

function getInboxViewportHeight() {
	// $(window) in firefox gave me different results??
	let windowHeight;
	if (DetectClient.isFirefox()) {
		windowHeight = window.outerHeight;
	} else {
		windowHeight = $(window).height();
	}
	return windowHeight - getInboxTop() - 4;
}

function resizeNodes() {
	console.log("resizeNodes");
	
	if (isDetached) {
		if (popupView == POPUP_VIEW_CHECKER_PLUS) {
			renderMoreAccountMails();
		} else {
			$("#tabletViewFrame").height( $(window).height() -  $("#tabletViewFrame").offset().top - 10 );
		}
	}
}

function findMailById(id) {
	var foundMail; 
	accounts.some(function(account) {
		return account.getMail().some(function(mail) {
			if (mail.id == id) {
				foundMail = mail;
				return true;
			}
		});
	});
	return foundMail;
}

function getDeepNode(id) {
	return $("html /deep/ #" + id);
}

function shouldWatermarkImage(skin) {
	//if (skin.name && skin.name.startsWith("[img:") && skin.author != "Jason") {
	if (skin.image && skin.author != "Jason") {
		return true;
	}
}

function addSkinPiece(id, css) {
	polymerPromise.then(function() {
		$("#" + id).append(css);
	});
}

function addSkin(skin, id) {
	if (!id) {
		id = "skin_" + skin.id;
	}
	$("#" + id).remove();
	
	var css = "";
	
	if (skin.image) {
		$("body").addClass("background-skin");

		// normally default is black BUT if image exists than default is white, unless overwritten with text_color
		if (skin.text_color != "dark") {
			css += " html:not(.searchInputVisible) #inboxSection app-header-layout app-toolbar paper-icon-button:not(#menu), #topLeft, #skinWatermark, .showMoreEmails {color:white} ";
		}

		var resizedImageUrl;
		if (/blogspot\./.test(skin.image) || /googleusercontent\./.test(skin.image)) {
			resizedImageUrl = skin.image.replace(/\/s\d+\//, "\/s" + $("body").width() + "\/");
		} else {
			resizedImageUrl = skin.image;
		}
		
		//css += "[main] {background-size:cover;background-image:url('" + resizedImageUrl + "');background-position-x:50%;background-position-y:50%} [main] paper-toolbar {background-color:transparent} .accountHeader {background-color:transparent}";
		// Loading the background image "after" initial load for 2 reasons: 1) make sure it loads after the mails. 2) to trigger opacity transition
		addSkinPiece(id, " #inboxSection app-header-layout::before {opacity:1;background-size:cover;background-image:url('" + resizedImageUrl + "');background-position-x:50%;background-position-y:50%} #inboxSection app-header-layout app-toolbar, .accountHeader {background-color:transparent}");

		if (shouldWatermarkImage(skin)) {
			$("#skinWatermark").addClass("visible");
			$("#skinWatermark").text(skin.author);
			if (skin.author_url) {
				$("#skinWatermark").attr("href", skin.author_url); 
			} else {
				$("#skinWatermark").removeAttr("href");
			}
		}
	}
	if (skin.css) {
		css += " " + skin.css;
	}
	
	addCSS(id, css);
}

function removeSkin(skin) {
	$("#skin_" + skin.id).remove();

	if (shouldWatermarkImage(skin)) {
		$("#skinWatermark").removeClass("visible");
	}
}

function setSkinDetails($dialog, skin) {
	
	$dialog.find("#skinCSS").off().on("click", function() {
		
		var $textarea = $("<textarea readonly style='width:400px;height:200px'></textarea>");
		$textarea.text(skin.css);
		
		openGenericDialog({
			title: "Skin details",
			content: $textarea
		});

		return false;
	});

	$("#skinAuthorInner").unhide();

	if (skin.css) {
		$dialog.find("#skinCSS").attr("href", "#");
	} else {
		$dialog.find("#skinCSS").removeAttr("href");
	}
	
	$dialog.find("#skinAuthor").text(skin.author);
	if (skin.author_url) {
		$dialog.find("#skinAuthor").attr("href", skin.author_url);
	} else {
		$dialog.find("#skinAuthor").removeAttr("href");
	}
}

function getSkin(skins, $paperItem) {
	return skins.find(skin => {
		return skin.id == $paperItem.attr("skin-id");
	});
}

function showSkinsDialog() {
	showLoading();
	
	bg.Controller.getSkins().then(skins => {
		
		var attemptedToAddSkin = false;
		
		var $dialog = initTemplate("skinsDialogTemplate");
		var $availableSkins = $dialog.find("#availableSkins");
		$availableSkins.empty();
		$availableSkins
			.off()
			.on("click", ".addButton", function (e) {
				attemptedToAddSkin = true;

				var $addButton = $(this);
				var $paperItem = $addButton.closest("paper-item");
				var skin = getSkin(skins, $paperItem);

				$("#previewSkin").remove();

				if ($addButton.hasClass("selected")) {
					console.log("remove skin: ", skin);
					$addButton.removeClass("selected");
					$addButton.attr("icon", "add");
					removeSkin(skin);
					skinsSettings.some(function (thisSkin, index) {
						if (skin.id == thisSkin.id) {
							skinsSettings.splice(index, 1);
							return true;
						}
					});
					Settings.store("skins", skinsSettings).then(() => {
						bg.Controller.updateSkinInstalls(skin.id, -1);
					}).catch(error => {
						showError(error);
					});

					$paperItem.removeAttr("focused");
					$paperItem.blur();

					e.preventDefault();
					e.stopPropagation();
					return false;
				} else if (donationClicked("skins")) {
					console.log("add skin");
					$addButton.addClass("selected");
					$addButton.attr("icon", "check");
					addSkin(skin);
					skinsSettings.push(skin);
					Settings.store("skins", skinsSettings).then(() => {
						bg.Controller.updateSkinInstalls(skin.id, 1);
					}).catch(error => {
						showError(error);
					});
				}
			})
			.on("click", "paper-item", function () {
				var $paperItem = $(this);
				// patch to remove highlighed gray
				$paperItem.removeAttr("focused");
				$paperItem.blur();

				$("#skinWatermark").removeClass("visible");
				var skin = getSkin(skins, $paperItem);
				addSkin(skin, "previewSkin");
				setSkinDetails($dialog, skin);
				return false;
			})
		;
		
		skins.forEach(function(skin) {
			var paperItem = document.createElement("paper-item");
			paperItem.setAttribute("skin-id", skin.id);

			var skinAdded = skinsSettings.some(function(thisSkin) {
				if (skin.id == thisSkin.id) {
					return true;
				}
			});
			
			var addButton = document.createElement("paper-icon-button");
			var className = "addButton";
			if (skinAdded) {
				className += " selected";
				addButton.setAttribute("icon", "check");
			} else {
				addButton.setAttribute("icon", "add");
			}
			addButton.setAttribute("class", className);
			addButton.setAttribute("title", "Add it");
			Polymer.dom(paperItem).appendChild(addButton);

			var textNode = document.createTextNode(skin.name);
			Polymer.dom(paperItem).appendChild(textNode);

			Polymer.dom($availableSkins[0]).appendChild(paperItem);
		});
		
		if (Settings.read("skinsEnabled")) {
			$dialog.find(".disableSkins").show();
			$dialog.find(".enableSkins").hide();
		} else {
			$dialog.find(".disableSkins").hide();
			$dialog.find(".enableSkins").show();
		}
		
		$dialog.find(".disableSkins").off().on("click", function() {
			Settings.store("skinsEnabled", false);
			location.reload();
		});

		$dialog.find(".enableSkins").off().on("click", function() {
			Settings.store("skinsEnabled", true);
			location.reload();
		});

		$dialog.find(".updateSkins").off().on("click", function() {
			skinsSettings.forEach(function(skinSetting) {
				skins.forEach(function(skin) {
					if (skinSetting.id == skin.id) {
						copyObj(skin, skinSetting);
						
						// refresh skin
						addSkin(skin);
					}
				});
			});
			Settings.store("skins", skinsSettings);
			showMessage(getMessage("done"));
		});
		
		$dialog.find(".customSkin").off().on("click", function() {
			$("#previewSkin").remove();
			
			var $dialog = initTemplate("customSkinDialogTemplate");

			var customSkin = Settings.read("customSkin");

			$dialog.find("textarea").val(customSkin.css);
			$dialog.find("#customBackgroundImageUrl").val(customSkin.image);

			$dialog.find(".shareSkin").off().on("click", function() {
				openUrl("https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=shareSkin");
			});

			$dialog.find(".updateSkin").off().on("click", function() {
				$("#customSkin").remove();
				addSkin({id:"customSkin", css:$dialog.find("textarea").val(), image:$dialog.find("#customBackgroundImageUrl").val()});
				if (!Settings.read("donationClicked")) {
					showMessage(getMessage("donationRequired"));
				}
			});
			
			openDialog($dialog).then(function(response) {
				if (response == "ok") {
					if (Settings.read("donationClicked")) {
						customSkin.css = $dialog.find("textarea").val();
						customSkin.image = $dialog.find("#customBackgroundImageUrl").val();
						
						addSkin(customSkin);
						Settings.store("customSkin", customSkin);
					} else {
						$dialog.find("textarea").val("");
						removeSkin(customSkin);
						if (!Settings.read("donationClicked")) {
							showMessage(getMessage("donationRequired"));
						}
					}
					
					$dialog[0].close();
				}
			});
		});

		/*
		// patch in conjunction with css: #skinsDialog paper-dialog-scrollable {max-height:215px}
		$dialog.off("iron-overlay-opened").on("iron-overlay-opened", function () {
			getShadowRoot($dialog.find("paper-dialog-scrollable")).find(".scrollable").css("max-height", "inherit");
		});
		*/
		
		openDialog($dialog).then(response => {
			if (response == "ok") {
				if ($("#previewSkin").length) {
					$("#previewSkin").remove();

					if (!attemptedToAddSkin) {
						openGenericDialog({
							content: "Use the <paper-icon-button style='vertical-align:middle' icon='add'></paper-icon-button> to add skins!"
						}).then(response => {
							if (response == "ok") {
								// make sure next time the skins dialog closes when clicking done
								$dialog.find(".okDialog").attr("dialog-confirm", true);
							}
						});
					} else {
						$dialog[0].close();
					}
					
				} else {
					if (!Settings.read("skinsEnabled")) {
						showMessage("You disabled the skins, use the Enable button");
					}
					$dialog[0].close();
				}
			}
		});

		hideLoading();

	}).catch(error => {
		console.error(error);
		showError("There's a problem, try again later or contact the developer!");
	});
}

function init() {
	
	/*
	pageVisible.then(() => {
		insertStylesheet("css/materialDesign.css");
	});
	*/
	
	bgObjectsReady = new Promise(function(resolve, reject) {
		getBGObjects().then(response => {
			resolve(response);
		});
	});
	
	return bgObjectsReady.then(() => {
		if (Settings.read("browserButtonAction") == BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
			if (location.href.indexOf("noSignedInAccounts") != -1) {
				popupView = POPUP_VIEW_TABLET;
			} else {
				if (totalUnreadCount === 0 && Settings.read("gmailPopupBrowserButtonActionIfNoEmail") == BROWSER_BUTTON_ACTION_CHECKER_PLUS) {
					popupView = POPUP_VIEW_CHECKER_PLUS;
				} else {
					popupView = POPUP_VIEW_TABLET;
				}
			}
		} else {
			if (location.href.indexOf("noSignedInAccounts") != -1) {
				popupView = POPUP_VIEW_CHECKER_PLUS;
			} else {
				if (totalUnreadCount === 0 && Settings.read("checkerPlusBrowserButtonActionIfNoEmail") == BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
					popupView = POPUP_VIEW_TABLET;
				} else {
					popupView = POPUP_VIEW_CHECKER_PLUS;
				}
			}
		}
		
		console.log("view: " + popupView);
	}).then(() => {
		return $.ready;
	}).then(() => {
		var $html = $("html");
		var $body = $("body");
		
		$body.addClass(Settings.read("accountAddingMethod"));

		if (DetectClient.isMac()) {
			$body.addClass("mac");
		}
		
		if (getMessage("dir") == "rtl") {
			$("app-drawer").attr("align", "end");
		}
		
		// Had to move this code here for some reason (probably before polymer loaded)
		var activeAccounts = getActiveAccounts(accounts);
		if (activeAccounts.length >= 2 && Settings.read("drawer") != "closed") {
			drawerIsVisible = true;
			$("app-drawer-layout")
				.removeAttr("force-narrow")
			;
			if (DetectClient.isFirefox()) {
				$("app-drawer-layout").addClass("ffopened");
				$("#drawerPanel").attr("opened", true);
				$("#drawerPanel").find(".app-drawer").last().attr("opened", true);
			}
			setTimeout(() => {
				$("app-drawer-layout").addClass("delay");
			}, 1500);
		}

		resizePopup();

		new Promise((resolve, reject) => {
			// Mac patch for Chrome v60-61 because the window would have an empty white space, it needs a delay before resizing it with css, refer to https://jasonsavard.com/forum/discussion/comment/16237#Comment_16237
			if (DetectClient.isMac()) {
				pageVisible.then(() => {
					setTimeout(() => {
						resolve();
					}, 100);
				});
			} else {
				resolve();
			}
		}).then(() => {
			$body.addClass(Settings.read("displayDensity"));
		});
	
		if (Settings.read("donationClicked")) {
			/*
			// remove contribute attribute for all templated nodes
			$("template").each(function() {
				$(this.content).find("[contribute]").removeAttr("contribute");
				console.log("removed")
			});
			*/
		} else {
			$body.addClass("donationNotClicked");
			
			$("body").on("mouseenter", "[contribute]", function(e) {
				console.log(e);
				var $donationRequired = $("#donationRequired");
				
				var left;
				var SPACING = 15;
				if (getMessage("dir") == "rtl") {
					left = $(this).offset().left + $(this).width() + SPACING;
				} else {
					left = $(this).offset().left - $donationRequired.width() - SPACING;
				}
				
				$donationRequired
					.css({left:left, top:$(this).offset().top + 5})
					.show()
				;
			}).on("mouseleave", "[contribute]", function() {
				var $donationRequired = $("#donationRequired");
				$donationRequired.hide();
			});
		}
		
		if (isDetached) {
			$html.addClass("detached");
			resizeNodes();
		}

		// do this right away to skip the transition when calling openEmail
		if (previewMailId && Settings.read("browserButtonAction") != BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
			$("body").addClass("page-loading-animation");
			$(".page").removeClass("active");
			$("#openEmailSection").addClass("active");
		} else if (location.href.indexOf("action=getUserMediaDenied") != -1 || location.href.indexOf("action=getUserMediaFailed") != -1) {
			polymerPromise.then(function() {
				setTimeout(function() {
					var params = {};
					
					var accountEmail = getUrlValue(location.href, "accountEmail", true);
					params.account = getAccountByEmail(accountEmail);
					params.skipAnimation = true;
					
					if (getUrlValue(location.href, "mediaType") == "voiceEmail") {
						params.voiceEmail = true;
					} else {
						params.videoEmail = true;
					}
					
					openComposeSection(params);
				}, 1)
			});
		}
		
		$(window).on("resize", function() {
			console.log("window.resize");
			if (windowOpenTime.diffInSeconds() > -1) {
				console.log("skip resize - too quick");
			} else {
				// in firefox this would loop alot and crash
				if (DetectClient.isChrome()) {
					resizeNodes();
				}
			}
		});
		
		resizeFrameInExternalPopup();

		if (Settings.read("skinsEnabled") && skinsSettings) {
			//pageVisible.then(() => {
				skinsSettings.forEach(function(skin) {
					addSkin(skin);
				});
				addSkin(Settings.read("customSkin"));
			//});
		}
		
		if (!Settings.read("showArchive")) {
			$body.addClass("hideArchive");
		}
		if (!Settings.read("showSpam")) {
			$body.addClass("hideSpam");
		}
		if (!Settings.read("showDelete")) {
			$body.addClass("hideDelete");
		}
		if (!Settings.read("showMoveLabel")) {
			$body.addClass("hideMoveLabel");
		}
		if (!Settings.read("showMarkAsRead")) {
			$body.addClass("hideMarkAsRead");
		}
		if (!Settings.read("showMarkAllAsRead")) {
			$body.addClass("hideMarkAllAsRead");
		}
		if (!Settings.read("showMarkAsUnread")) {
			$body.addClass("hideMarkAsUnread");
		}
		if (!Settings.read("showReply")) {
			$body.addClass("hideReply");
		}
		if (!Settings.read("showOpen")) {
			$body.addClass("hideOpen");
		}
		
		$body
			.click(function() {
				// reset interval everytime user clicks in popup
				if (isDetached) {
					clearInterval(renderAccountsInterval);
					renderAccountsInterval = setIntervalSafe(function() {
						renderAccounts();
					}, seconds(30));
				}
			})
			.keydown(function(e) {
				var $selectedMail = $(".mail").first();
				
				if (isFocusOnInputElement()) {
					// do nothing
				} else {
					if (keydown(e, 37) || keydown(e, 39)) {
						if (isEmailView()) {
							openInbox();
						} else {
							$selectedMail.click();
						}
					}
				}
			})
			.keypress(function(e) {
				//console.log("key: ", e);
				
				if (isFocusOnInputElement()) {
					//return true;
				} else {
					var $selectedMail = $(".mail").first();
					
					initInboxMailActionButtons($selectedMail);
					
					if (keydown(e, 'c')) {
						$(".account:first .compose").click();
					} else if (keydown(e, 'o') || e.which == 13) { // left or right
						if (!isComposeView()) {
							if ($selectedMail.length) { // found unread email so open the email
								if (e.which == 13) {
									// enter toggles between preview mode
									if (isEmailView()) {
										//openInbox();
									} else {
										$selectedMail.click();
									}
								} else {
									$selectedMail.find(".openMail").click();
								}
							} else { // no unread email so open the inbox instead
								getFirstActiveAccount(accounts).openInbox();
								closeWindow({source:"openInboxShortcutKey"});
							}
						}
					} else if (keydown(e, '#', {shift:true})) { // # = delete
						if (isEmailView()) {
							$("#delete").click();
						} else {
							$selectedMail.find(".delete").click();
						}
					} else if (keydown(e, 'e')) { // e = archive
						if (isEmailView()) {
							$("#archive").click();
						} else {
							$selectedMail.find(".archive").click();
						}
					} else if (keydown(e, '!', {shift:true})) { // ! = spam
						if (isEmailView()) {
							$("#markAsSpam").click();
						} else {
							$selectedMail.find(".markAsSpam").click();
						}
					} else if (keydown(e, 's')) { // s = star
						if (isEmailView()) {
							$("#openEmail .star").click();
						} else {
							$selectedMail.find(".star").click();
						}
					} else if (keydown(e, 'v')) { // move
						if (isEmailView()) {
							$("#moveLabel").click();
						}
					// r = reply (if setting set for this)
					} else if ((Settings.read("keyboardException_R") == "reply" && keydown(e, 'r')) || keydown(e, 'a')) {
						if ($selectedMail.length) {
							if (isEmailView()) {
								if (keydown(e, 'r')) {
									$("#replyArea").removeAttr("replyAll");
								} else {
									$("#replyArea").attr("replyAll", true);
								}
								getReplyTextArea()
									.click() // click is necessary???
									.focus()
								;
							} else {
								$selectedMail.click();
								setTimeout(function() {
									if (keydown(e, 'r')) {
										$("#replyArea").removeAttr("replyAll");
									} else {
										$("#replyArea").attr("replyAll", true);
									}
									getReplyTextArea()
										.click() // click is necessary???
										.focus()
									;
								}, 300);
							}
							return false;
						}
					} else if (keydown(e, 'I') || (Settings.read("keyboardException_R") == "markAsRead" && keydown(e, 'r'))) {
						if (isEmailView()) {
							$("#markAsRead").click();
						} else {
							$selectedMail.find(".markAsRead").click();
						}
					} else {
						console.log("key not recognized: ", e);
					}
				}
				
			})
		;
		
		$("#titleClickArea").click(function() {
			if (Settings.read("clickingCheckerPlusLogo") == "openHelp") {
				openUrl("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail?ref=GmailChecker");
			} else {
				openGmail(accounts);
				closeWindow({source:"titleClickArea"});
			}
		});

		if (Settings.read("removeShareLinks")) {
			// hide actual share button
			$(".share-button").closest("paper-menu-button").remove();
			// hide share button (placeholder)
			$(".share-button").remove();
		}
		
		$(".share-button").on("mousedown", function() {
			maxHeightOfPopup();
		});
		$(".share-button").one("click", function() {
			Settings.enable("followMeClicked");
			var $shareMenu = initTemplate("shareMenuItemsTemplate");
			
			$("#share-menu paper-item").click(function() {
				var value = $(this).attr("id");
				sendGA('shareMenu', value);
				
				var urlToShare = "https://jasonsavard.com/Checker-Plus-for-Gmail";
				var imageToShare = "https://jasonsavard.com/images/extensions/mediumCheckerPlusForGmail.png";
				
				if (value == "facebook") {
					openUrl("https://www.facebook.com/thegreenprogrammer");
				} else if (value == "twitter") {
					openUrl("https://twitter.com/JasonSavard");
				} else if (value == "googleplus") {
					openUrl("https://plus.google.com/+JasonSavardTheGreenProgrammer");
				} else if (value == "linkedin") {
					openUrl("https://www.linkedin.com/in/jasonsavard");
				}
			});

		})

		$("#refresh").click(function() {
			refresh();
		});
		
		$("#maximize").mousedown(function(e) {
			if (isCtrlPressed(e)) {
				openWindowInCenter(chrome.runtime.getURL("popup.html"), '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes', Settings.read("popupWidth"), Settings.read("popupHeight"));
				closeWindow({source:"maximize"});
			} else {
				var currentAccount;
				if (currentTabletFrameEmail) {
					currentAccount = getAccountByEmail(currentTabletFrameEmail);
				}
			   
				if (currentAccount) {
					if (Settings.read("tabletViewUrl")) {
						var messageId = extractMessageIdFromOfflineUrl(Settings.read("tabletViewUrl"));
						if (messageId) {
							currentAccount.openMessageById({messageId:messageId});
						} else { // NOT vieing a message, probably in the inbox or something
							currentAccount.openInbox();
						}
					} else {
						currentAccount.openInbox();
					}
				} else {
					openGmail(accounts);
				}
				sendGA("maximize", "click");
				closeWindow({source:"maximize"});
			}
		});
		
		if (Settings.read("quickComposeEmail")) {
			var quickComposeEmailAlias = Settings.read("quickComposeEmailAlias");
			if (quickComposeEmailAlias) {
				$("#quickContactLabel").text(quickComposeEmailAlias);
			}
			
			var contactPhotoParams = $.extend({}, {useNoPhoto:true, account:getFirstActiveAccount(accounts), email:Settings.read("quickComposeEmail")});
			var $imageNode = $("#quickContactPhoto");
			setContactPhoto(contactPhotoParams, $imageNode);
		}
		
		$("#quickContact").click(function() {
			openQuickCompose();
		});
		
		$("#composeArea")
			.hover(function() {
				$("#compose").attr("icon", "create");
			}, function() {
				$("#compose").attr("icon", "add");
			})
		;
		
		$("#compose")
			.click(function() {
				$(".account:first .compose").click();
			})
		;
		
		$("#mainOptions").on("mousedown", function() {
			maxHeightOfPopup();
		});
		
		// must use .one because we don't want to queue these .click inside (was lazy and didn't want to code .off .on :)
		$("#mainOptions").one("click", function() {
			maxHeightOfPopup();
			
			$(".switchView").click(function() {
				closeMenu(this);
				reversePopupView(true);
				renderMoreAccountMails();
			});
			
			initSwitchMenuItem();
			
			$(".popout").click(function() {
				openUrl(getPopupFile());
			});
			
			$(".dnd")
				.click(function() {
					
					var $dialog = initTemplate("dndDialogTemplate");
					var $radioButtons = $dialog.find("paper-radio-button");
					
					$radioButtons.off().on("change", function() {
						var value = $(this).attr("name");
						if (value == "today") {
							setDND_today();
						} else if (value == "indefinitely") {
							setDND_indefinitely();
						} else {
							setDND_minutes(value);
						}
						setTimeout(function() {
							closeWindow();
						}, 200);
					});

					openDialog($dialog).then(response => {
						if (response == "ok") {
							// nothing
						} else if (response == "other") {
							openDNDScheduleOptions();
						} else {
							openDNDOptions();
						}
					});
					
					closeMenu(this);
				})
			;
			
			$(".dndOff")
				.click(function() {
					setDND_off();
					
					// wait for message sending to other extension to sync dnd option
					setTimeout(function() {
						closeWindow();
					}, 10);
				})
			;

			if (isDNDbyDuration()) {
				$(".dnd").hide();
			} else {
				$(".dndOff").hide();
			}
			
			$(".displayDensity").click(function() {
				closeMenu(this);
				
				var $dialog = initTemplate("displayDensityDialogTemplate");
				var $radioButtons = $dialog.find("paper-radio-button");
				
				//$dialog.find("[name='" + Settings.read("displayDensity") + "']").attr("checked", true);
				$dialog.find("paper-radio-group")[0].setAttribute("selected", Settings.read("displayDensity"));
				
				$radioButtons.off().on("change", function() {
					var value = $(this).attr("name");
					Settings.store("displayDensity", value);
					
					//location.reload();
					$("body")
						.removeClass("comfortable cozy compact")
						.addClass(value)
					;
				});
				
				openDialog($dialog).then(function(response) {
					if (response == "ok") {
						// nothing
					}
				});
			});
			
			$(".skins")
				.click(function() {
					closeMenu(this);
					showSkinsDialog();
					sendGA('topbar', 'skins');
				})
			;

			$(".options").click(function() {
				if (inWidget) {
					openUrl("options.html?ref=popup#widget");
				} else {
					openUrl("options.html?ref=popup");
				}
			});

			$(".changelog").click(function() {
				openUrl("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail_changelog?ref=GmailCheckerOptionsMenu");
			});

			$(".contribute").click(function() {
				openUrl("donate.html?ref=GmailCheckerOptionsMenu");
			});

			$(".discoverMyApps").click(function() {
				openUrl("https://jasonsavard.com?ref=GmailCheckerOptionsMenu");
			});

			$(".feedback").click(function() {
				openUrl("https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=GmailCheckerOptionsMenu");
			});

			$(".followMe").click(function() {
				openUrl("https://jasonsavard.com/?followMe=true&ref=GmailCheckerOptionsMenu");
			});

			$(".aboutMe").click(function() {
				openUrl("https://jasonsavard.com/about?ref=GmailCheckerOptionsMenu");
			});

			$(".help").click(function() {
				openUrl("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail?ref=GmailCheckerOptionsMenu");
			});
		});
		
		$(".close").click(function() {
			window.close();
		});
		
		if (daysElapsedSinceFirstInstalled() >= UserNoticeSchedule.DAYS_BEFORE_SHOWING_FOLLOW_ME && !Settings.read("followMeClicked")) {
			let expired = false;
			if (Settings.read("followMeShownDate")) {
				if (Settings.read("followMeShownDate").diffInDays() <= -UserNoticeSchedule.DURATION_FOR_SHOWING_FOLLOW_ME) {
					expired = true;
				}
			} else {
				Settings.storeDate("followMeShownDate");
			}
			if (!expired) {
				$(".share-button-real .share-button").addClass("swing");
			}
		}
	
		polymerPromise.then(() => {
			if (shouldShowExtraFeature()) {
				$("#newsNotification")
					.attr("icon", "myIcons:theme")
					.unhide()
					.click(function() {
						maxHeightOfPopup();
						showSkinsDialog();
					})
				;
				$("#newsNotificationReducedDonationMessage").text( getMessage("addSkinsOrThemes") );
			} else if (shouldShowReducedDonationMsg(true)) {
				$("#newsNotification")
					.unhide()
					.click(function() {
						openUrl("donate.html?ref=reducedDonationFromPopup");
					})
				;
			}
		});

		getDNDState().then(function(dndState) {
			if (dndState) {
				polymerPromise2.then(function() {
					showError(getMessage("DNDisEnabled"), {
						text: getMessage("turnOff"),
						onClick: function() {
							setDND_off();
							hideError();
						}
					});
				});
			}
		});
		
		// FYI whole block below used to be above document.ready
		return polymerPromise.then(() => {

			$("body").removeAttr("jason-unresolved");

			return bgObjectsReady.then(() => {
				
				stopAllSounds();
				
				if (isDetached && !Settings.read("popoutMessage") && !previewMailId && location.href.indexOf("action=getUserMediaDenied") == -1 && location.href.indexOf("action=getUserMediaFailed") == -1) {
					setTimeout(function() {
						openDialog(initTemplate("popoutDialogTemplate")).then(function(response) {
							if (response == "ok") {
								// nothing
							} else {
								openUrl("https://jasonsavard.com/wiki/Popout?ref=gmailPopoutDialog");
							}
						});
						Settings.enable("popoutMessage");
					}, 500)
				}
				
				getZoomFactor().then(function(zoomFactor) {
					if (fromToolbar && window && zoomFactor > 1) {
						$("html").addClass("highDevicePixelRatio");
					}
				});
				
				initPopupView();

				$("#menu").click(function() {
					let drawerLayout = $("app-drawer-layout")[0];

					if (DetectClient.isChrome() && (drawerLayout.forceNarrow || !drawerLayout.narrow)) {
						drawerLayout.forceNarrow = !drawerLayout.forceNarrow;
					}

					if (drawerLayout.drawer.opened) {
						drawerLayout.drawer.close();
						Settings.store("drawer", "closed");
						if (DetectClient.isFirefox()) {
							$("app-drawer-layout").removeClass("ffopened");
						}
					} else {
						drawerLayout.drawer.open();
						Settings.store("drawer", "open");
						if (DetectClient.isFirefox()) {
							$("app-drawer-layout").addClass("ffopened");
						}
					}
				});
				
				$("#searchInput")
					.blur(function() {
						$("html").removeClass("searchInputVisible");
					})
					.keypress(function(e) {
						if (e.key == "Enter") {
							var account = $(this).data("account");
							account.openSearch( $(this).val() );
							closeWindow({source:"onlyMailAndInPreview"});
						}
					})
				;

				if (accounts.length == 0 || (accounts.length == 1 && accounts[0].error && accounts[0].error != "timeout" && accounts.first().getMailUrl().indexOf("/mail/") != -1)) {

					// firefox patch
					if (accounts.length) {
						let accountError = accounts.first().error;
						if (accountError && accountError.toString().indexOf("dead object") != -1) {
							chrome.runtime.reload();
						}
					}

					var $dialog;

					var mustUseAddAccount = accounts.some(account => {
						if (account.errorCode == JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD) {
							return true;
						}
					});

					if (Settings.read("accountAddingMethod") == "autoDetect" && !mustUseAddAccount) {
						$dialog = initTemplate("signInTemplate");
					} else {
						$dialog = initTemplate("addAccountTemplate");
					}

					if (accounts.length == 1 && accounts.first().error) {
						if (accounts.first().getError().niceError && accounts.first().getError().niceError != "error") {
							$dialog.find("#signInError").text(accounts.first().getError().niceError);
						} else {
							if (Settings.read("accountAddingMethod") == "autoDetect") {
								$dialog.find("#signInError").text("Problem auto-detecting account.");
							} else {
								$dialog.find("#signInError").text("Problem reading account.");
							}
						}
						$dialog.find("#signInErrorInstructions").text(accounts.first().getError().instructions);
					} else {
						if (Settings.read("accountAddingMethod") == "autoDetect") {
							$dialog.find("#signInError").text("Must sign in!");
						} else {
							$dialog.find("#signInError").text("Must add an account!");
						}
					}

					if (Settings.read("accountAddingMethod") == "autoDetect" && !mustUseAddAccount) {
						openDialog($dialog).then(response => {
							if (response == "ok") {
								openUrl(Urls.SignOut);
							} else if (response == "other") {
								openUrl("https://jasonsavard.com/wiki/Auto-detect_sign_in_issues");
							} else if (response == "other2") {
								$dialog[0].close();
								refresh().then(() => {
									if (accounts.length == 0 || getAccountsWithErrors(accounts).length) {
										location.reload();
									}
								});
							} else {
								openUrl("options.html#accounts");
							}
						}).catch(error => {
							showError("error: " + error);
						});
					} else {
						openDialog($dialog).then(response => {
							if (response == "ok") {
								let url = "options.html";
								if (mustUseAddAccount) {
									url += "?highlight=addAccount";
								}
								url += "#accounts";
								openUrl(url);
							} else {
								$dialog[0].close();
								refresh().then(() => {
									location.reload();
								});
							}
						}).catch(error => {
							showError("error: " + error);
						});
					}
				} else {
					
					if (accounts.length <= 1) {
						$("#menu").hide();
					}
					
					renderAccounts();
					
					if (previewMailId && Settings.read("browserButtonAction") != BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
						var mail = findMailById(previewMailId);
						openEmail({mail:mail});
					}
				}

				// patch for mac issue popup clipped at top ref: https://bugs.chromium.org/p/chromium/issues/detail?id=428044
				// must make sure rendermoreaccounts still works
				// v3 commented in Chrome 66 because was showing vertical scroll bars
				// v2 add code here after rendering accounts
				// v1 settimeout in resizePopup when changing height
				/*
				if (DetectClient.isMac()) {
					let h = $("body").height();
					$("body").height(h + 1);
				}
				*/
				
				$(window).on("unload", function() {
					if (mouseHasEnteredPopupAtleastOnce) {
						Settings.storeDate("lastCheckedEmail");
					}
					stopAllSounds();
				});
			   
				$('body').hover(function () {
					mouseInPopup = true;
					if (!mouseHasEnteredPopupAtleastOnce) {
						console.log("stop any speaking")
						stopAllSounds();
					}
					mouseHasEnteredPopupAtleastOnce = true;
				}, function () {
					mouseInPopup = false;
				});
				
				polymerPromise2.then(function () {
					var currentlyRenderingMails = false;
					// getInboxScrollTarget() works for polymer
					// #inboxSection app-drawer-layout works when I use overflow-y:scroll
					// patch need to add (#inboxSection app-drawer-layout) because when i set the hasVerticalScrollbars ... {overflow-y:scroll} then the polymer scroll event does not trigger anymore so default
					$(getInboxScrollTarget()).add("#inboxSection app-drawer-layout").on("scroll", function(e) {
						var target = e.originalEvent.target;
						if (target.scrollTop != 0) {
							if (!currentlyRenderingMails) {
								currentlyRenderingMails = true;
								renderMoreAccountMails();
								currentlyRenderingMails = false;
							}
						}
					});
				});
				/*
				var accountsTemplate = document.querySelector('#accountsTemplate');
				if (accountsTemplate) {
					// template-bound event is called when an auto-binding element is ready
					accountsTemplate.addEventListener('template-bound', function () {
						console.log("accounts template-bound")
						
						setMailDetails(accounts, $(".mail"));
					});
					
					syncMails();
					
					accountsTemplate.accounts = accounts;
				}
				*/

				var autoSaveObj = Settings.read("autoSave");
				if (autoSaveObj && autoSaveObj.message) {
					var $dialog = initTemplate("draftSavedTemplate");
					var $draftSavedTextarea = $dialog.find("#draftSavedTextarea");
					$draftSavedTextarea.val(autoSaveObj.message);
					
					// delay after loading poymer or else dialog would not center properly
					setTimeout(function() {
						openDialog($dialog).then(response => {
							console.log("response: " + response);
							if (response == "ok") {
								$draftSavedTextarea
									.focus()
									.select()
								;
								if (document.execCommand('Copy')) {
									$dialog[0].close();
									showMessage(getMessage("done"));
								} else {
									niceAlert("Please select the text and right click > Copy");
								}
							}
							Settings.delete("autoSave");
							// v2: autoclosedisable had nothing to do with it, the issue was related to putting span tags inside the cancel and ok buttons (don't do that, just put text). v1:because i set autoCloseDisabled="true" we have to explicitly close the dialog
							//$dialog[0].close();
						}).catch(function(error) {
							showError("error: " + error);
						});
					}, 1) // 800 before
				}
				
				// Delay some
				setTimeout(function() {
					var $optionsMenu = initTemplate("optionsMenuItemsTemplate");
					initMessages("#options-menu *");
				}, 400);
			});
		});
	});
}

console.time("init");
init().then(() => {
	console.timeEnd("init");
});