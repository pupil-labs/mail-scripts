function setup(){
  // run the setup script in order to set script properties and triggers
  setupScriptProperties();
  setupTriggers();
}

function setupScriptProperties() {
  // delete all triggers if existing
  PropertiesService.getScriptProperties().deleteAllProperties();

  // get the current user of the script
  // and all email aliases (if any)
  // save to script properties for lookup in other functions
  var scriptProperties = PropertiesService.getScriptProperties();
  var activeUser = [Session.getActiveUser().getEmail()];
  var aliases = GmailApp.getAliases();
  var addresses = activeUser.concat(aliases);
  // the array must be stringified b/c script properties only string key value pairs 
  scriptProperties.setProperties({"email_addresses":JSON.stringify(addresses)});
}

function setupTriggers(){

  // delete all old triggers if any existing 
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  
  // create new triggers

  // threads to inbox is called every minute
  ScriptApp.newTrigger('threadsToInbox')
      .timeBased()
      .everyMinutes(1)
      .create();

  // snooze is called daily at 5AM
  // the `atHour` function runs + or - 15 min
  // so the time is not always exactly the same
  ScriptApp.newTrigger('snooze')
      .timeBased()
      .atHour(5)
      .everyDays(1)
      .create();

  // nag is called daily at 6AM
  // the `atHour` function runs + or - 15 min
  // so the time is not always exactly the same
  ScriptApp.newTrigger('nag')
      .timeBased()
      .atHour(6)
      .everyDays(1)
      .create();
}


/**
 * Passed into the configuration factory constructor
 * @return {myproj.json.Configuration} Default configuration settings.
 */
// required if using configuration library 
function getDefaultConfiguration_() {
  return {
    debug: false,
    sheets: {
      debugSpreadsheetId: null
    }
  };
}