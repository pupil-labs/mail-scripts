function setup(){
  // run the setup script in order to set script properties and triggers
  
  // get the current user of the script
  // and all email aliases (if any)
  // save to script properties for lookup in other functions
  var scriptProperties = PropertiesService.getScriptProperties();
  var activeUser = [Session.getActiveUser().getEmail()];
  var aliases = GmailApp.getAliases();
  var addresses = activeUser.concat(aliases);
  // the array must be stringified b/c script properties only string key value pairs 
  scriptProperties.setProperties({"email_addresses":JSON.stringify(addresses)});

  // create triggers programmatically

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

function threadsToInbox(){  
  // reapply the inbox label to threads in the inbox
  // Quota for App script trigger = 6 hours runtime / day ( reference: https://developers.google.com/apps-script/guides/services/quotas )
  //   - If this function is called every 1 minute, the maximum runtime is calculated as follows (must be less than quota as we have other triggers):
  //     - max_runtime < (6 hours total quota / 60 minutes) / (1 trigger/minute * 60 minutes/hr * 24 hr/day )
  //     - max_runtime < (360 minutes quota) / (1440 minutes)
  //     - max_runtime < 15 seconds  
  //   - Current runtime is dependent on 
  // uncomment the line below and the last line in the function to see runtime
  // var startTime = new Date().getTime();
  
  var threads = GmailApp.getInboxThreads(0,15); //we don't need to look at everything in the inbox just most recent 15 threads
  var messages = GmailApp.getMessagesForThreads(threads);
  // get all email addresses and aliases for the current user as a list
  var my_email_addresses = JSON.parse(PropertiesService.getScriptProperties().getProperty("email_addresses"));
  var threadsToUpdate = [];

  if (messages == null){
    Logger.log("Mail Script `messages` = " + typeof messages);
    return;
  } else {

    for (var i = 0; i < messages.length; i++) {
      
      try{
        var len = messages[i].length-1;
      }catch(e) {
        Logger.log("Mail Script Error : messages[i].length-1. Error message: " + e.message);
        // return early 
        return; 
      }      
      
      var last_sender_email = getLastSenderEmail(messages[i][len].getFrom());

      // if we are not the last sender in the thread, then add thread to update list
      // we need to move new messages to the appropriate place within the priority inbox
      if (indexOf.call(my_email_addresses, last_sender_email) < 0) {
        threadsToUpdate.push(threads[i]);   
      }
    }
  }
  
  if (threadsToUpdate.length > 0) {
    GmailApp.moveThreadsToInbox(threadsToUpdate);
    GmailApp.refreshThreads(threadsToUpdate);
  }

  // uncomment to test runtimes
  // Logger.log("Function runtime: %s", new Date().getTime() - startTime); 
}


// snooze conversation -- return the conversation to the inbox after XX days of last message count
function snooze(){
  // label variables
  // you must make the "snooze" label and at least one time label
  // time labels in your gmail interface must match those below
  // you can use a combination of labels  
  var snoozeLabel = "snooze";
  var awakeLabel = "awake";
  var timeLabels = ["4w","1w","3d","1d"];

  var allLabels = GmailApp.getUserLabels();
  var threads = GmailApp.getUserLabelByName(snoozeLabel).getThreads();
  
  for (var j = 0; j < threads.length; j++) {        

    var threadLabels = threads[j].getLabels();
    // filter for timelabels 
    var snoozeTimes = filterTimeLabels(threadLabels,timeLabels);
    // add up times from labels - return in milliseconds 
    // if no time-label applied, then it will be moved to the inbox the next time the script runs -- runs at midnight-1am GMT  
    var timeLimit = sumTimeFromDateLabels(snoozeTimes);

    var lastMessageDate = threads[j].getLastMessageDate();
    var now = new Date();
    var timeBetweenDates = getTimeBetweenDates(lastMessageDate,now);
    
    if (timeBetweenDates >= timeLimit) {
      for (var i = 0; i < snoozeTimes.length; i++) {
        threads[j].removeLabel(GmailApp.getUserLabelByName(snoozeTimes[i])); 
      }
      threads[j].removeLabel(GmailApp.getUserLabelByName(snoozeLabel));
      threads[j].addLabel(GmailApp.getUserLabelByName(awakeLabel));
      threads[j].moveToInbox();
      threads[j].refresh();
    } 
  }
}


// nag - require reply from customer within XX days
// move thread to inbox only if there was no reply from the customer to the thread within specified time period
function nag() {
  // label variables -- update to match those in gmail interface if required
  var nagLabel = "nag";
  var replyFailLabel = "failure to reply"
  var timeLabels = ["4w","1w","3d","1d"];
  var my_email_addresses = JSON.parse(PropertiesService.getScriptProperties().getProperty("email_addresses"));

  var allLabels = GmailApp.getUserLabels();
  var threads = GmailApp.getUserLabelByName(nagLabel).getThreads();
  
  for (var j = 0; j < threads.length; j++) {        
    // Last Date = Mon Oct 12 14:48:13 GMT+07:00 2015
    var threadLabels = threads[j].getLabels();
    var messages = threads[j].getMessages();
    var last_sender = getLastSenderEmail(messages[messages.length-1].getFrom());

    var nagTimes = filterTimeLabels(threadLabels,timeLabels);
    var timeLimit = sumTimeFromDateLabels(nagTimes);
    
    var lastMessageDate = threads[j].getLastMessageDate();
    var now = new Date();
    var timeBetweenDates = getTimeBetweenDates(lastMessageDate,now);
    
    if (timeBetweenDates >= timeLimit) {

      // if last message in the thread is **not** from our email_addresses
      // this means we got a reply within our nag timelimit
      // and we can remove the nagLabel 
      if (indexOf.call(my_email_addresses, last_sender_email) < 0) {
        for (var i = 0; i < nagTimes.length; i++) {
          threads[j].removeLabel(GmailApp.getUserLabelByName(nagTimes[i])); 
        }
        threads[j].removeLabel(GmailApp.getUserLabelByName(nagLabel));
        threads[j].refresh();
      } else {
        // the last message in the thread **is** from our email_addresses 
        // therefore we assume we didn't get a reply
        // and can add the replyFailLabel  

        for (var i = 0; i < nagTimes.length; i++) {
          // remove all nage time labels
          threads[j].removeLabel(GmailApp.getUserLabelByName(nagTimes[i])); 
        }
        // remove nag label and apply the replyFailLabel
        threads[j].removeLabel(GmailApp.getUserLabelByName(nagLabel));
        threads[j].addLabel(GmailApp.getUserLabelByName(replyFailLabel));
  
        threads[j].moveToInbox();
        threads[j].refresh();
      }
    }  
  }
}