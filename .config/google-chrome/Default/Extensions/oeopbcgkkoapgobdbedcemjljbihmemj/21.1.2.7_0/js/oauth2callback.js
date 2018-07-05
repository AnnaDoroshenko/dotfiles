var Settings = bg.Settings;

function closeWindow() {
	var windowId = localStorage["_permissionWindowId"];
	if (windowId) {
		localStorage.removeItem("_permissionWindowId");
		chrome.windows.remove(parseInt(windowId));
	}
	$("body").removeClass("page-loading-animation").append("You can close this window!");
	window.close();
}

function processOAuthUserResponse(oAuthForMethod, code, oauthFollowupMethod) {
	var tokenResponse;
	
	return oAuthForMethod.getAccessToken({code:code}).then(accessTokenResponse => {
		bg.console.log("accessTokenResponse", accessTokenResponse);
		tokenResponse = accessTokenResponse.tokenResponse;
		return oauthFollowupMethod(tokenResponse);
	}).then(sendMessageParams => {
		return new Promise((resolve, reject) => {
			if (isPopupOrOptionsOpen()) {
				// append oauth token in case needed
				sendMessageParams.tokenResponse = tokenResponse;
				chrome.runtime.sendMessage(sendMessageParams, () => {
					closeWindow();
					resolve();
				});
			} else {
				location.href = chrome.runtime.getURL("popup.html");
				resolve();
			}
		});
	});
}

function isPopupOrOptionsOpen() {
	return chrome.extension.getViews().some(thisWindow => {
		if (thisWindow.location.href.indexOf("popup.html") != -1 || thisWindow.location.href.indexOf("options.html") != -1) {
			return true;
		}
	});
}

function showError(error) {
	$("body").removeClass("page-loading-animation");
	$("body").text(error);
}

$(document).ready(() => {
	var code = getUrlValue(location.href, "code", true);
	if (code) {
		var securityToken = getUrlValue(location.href, "security_token");
		
		var processOAuthUserResponsePromise;

		if (securityToken == bg.oAuthForEmails.getSecurityToken()) {
			processOAuthUserResponsePromise = processOAuthUserResponse(bg.oAuthForEmails, code, tokenResponse => {
				// do nothing
				return Promise.resolve({command:"grantPermissionToEmails"});
			});
		} else if (securityToken == bg.oAuthForProfiles.getSecurityToken()) {
			processOAuthUserResponsePromise = processOAuthUserResponse(bg.oAuthForProfiles, code, tokenResponse => {
				return bg.oAuthForProfiles.send({userEmail:tokenResponse.userEmail, url: "https://www.googleapis.com/plus/v1/people/me"}).then(response => {
					var data = response.data;
					if (data) {
						console.log(data);
						if (data.image && data.image.url) {
							var account = getAccountByEmail(tokenResponse.userEmail);
							account.saveSetting("profileInfo", data);
							return {command:"profileLoaded"};
						} else {
							throw new Error("No profile picture found");
						}
					}
				});
			});
		} else if (securityToken == bg.oAuthForContacts.getSecurityToken()) {
			processOAuthUserResponsePromise = processOAuthUserResponse(bg.oAuthForContacts, code, tokenResponse => {
				return fetchContacts(tokenResponse.userEmail).then(response => {
					var contactsData = Settings.read("contactsData");
					if (!contactsData) {
						contactsData = [];
					}
					
					var dataIndex = getContactsDataIndexByEmail(contactsData, response.contactDataItem.userEmail);
					if (dataIndex != -1) {
						console.log('found: updating existing contactsDataItem')
						contactsData[dataIndex] = response.contactDataItem;
					} else {
						console.log("creating new contactsDataItem");
						contactsData.push(response.contactDataItem);
					}
					
					console.log("contactdata: ", contactsData);
					Settings.store("contactsData", contactsData);
					Settings.store("showContactPhoto", true);
					return {command: "grantPermissionToContacts", contactDataItem:response.contactDataItem};
				});
			});
		}
		
		if (processOAuthUserResponsePromise) {
			processOAuthUserResponsePromise.catch(error => {
				showError(error);
			});
		} else {
			showError("security_token not matched!");
		}
	} else {
		var url = "https://jasonsavard.com/wiki/Granting_access?ref=permissionDenied&ext=gmail";
		var openPromise;
		
		if (isPopupOrOptionsOpen()) {
			openPromise = openUrl(url);
		} else {
			openPromise = openUrl(url, parseInt(localStorage._currentWindowId));
		}
		
		openPromise.then(() => {
			closeWindow();
		});
	}
});