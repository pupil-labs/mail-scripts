function threadsToInbox(){  
  // reapply the inbox label to threads in the inbox
  // Quota for App script trigger = 6 hours runtime / day ( reference: https://developers.google.com/apps-script/guides/services/quotas )
  //   - If this function is called every 1 minute, the maximum runtime is calculated as follows (must be less than quota as we have other triggers):
  //     - max_runtime < (6 hours total quota / 60 minutes) / (1 trigger/minute * 60 minutes/hr * 24 hr/day )
  //     - max_runtime < (360 minutes quota) / (1440 minutes)
  //     - max_runtime < 15 seconds or 15000 milliseconds   
  // Average runtime should be between 2 to 4 seconds (unless the inbox is full of threads of length 10000+)

  var config = Configuration.getCurrent();
  // override GAS console logger and use our spreadsheet
  // defined as environment variable for debug configuration
  Logger = BetterLog.useSpreadsheet(config.sheets.logSheetId);
  Logger.setLevel(config.logLevel);
  

  // startTime is only used for profiling in debug mode
  // the call to config/logger is not included in timing
  var startTime = new Date().getTime();
  
  var threads = GmailApp.getInboxThreads(0,15); //we don't need to look at everything in the inbox just most recent 15 threads
  var messages = GmailApp.getMessagesForThreads(threads);
  // get all email addresses and aliases for the current user as a list
  var my_email_addresses = JSON.parse(PropertiesService.getScriptProperties().getProperty("email_addresses"));
  var threadsToUpdate = [];

  if (messages === null){
    Logger.warning("Mail Script `messages` = " + typeof messages);
    return;
  } else {

    for (var i = 0; i < messages.length; i++) {
      
      var len = 0;
      try{
        len = messages[i].length-1;
      }catch(e) {
        Logger.warning("Warning : There are no more messages - messages[i].length-1. Error message: " + e.message);
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
    try{
      GmailApp.moveThreadsToInbox(threadsToUpdate);
      GmailApp.refreshThreads(threadsToUpdate);
    }catch(e){
      Logger.warning("Could not refresh Gmail Inbox. Messages: " + e.message);
    }
  }

  // Logger.debug("Function runtime in (ms): %s", new Date().getTime() - startTime); 
}


// snooze conversation -- return the conversation to the inbox after XX days of last message count
function snooze(snoozeLabel,awakeLabel,timeLabels){
  // label variables
  // you must make the "snooze" label and at least one time label
  // time labels in your gmail interface must match those in the prd config
  // you can use a combination of labels  
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
      if (awakeLabel){
        // apply the awake label to the thread
        threads[j].addLabel(GmailApp.getUserLabelByName(awakeLabel));      
      }
      threads[j].moveToInbox();
      threads[j].refresh();
    } 
  }
}


function updateSnooze(){
  var config = Configuration.getCurrent();
  var snoozeLabel = config.gmailLabels_snooze;
  var awakeLabel = config.gmailLabels_awake;
  var timeLabels = config.gmailLabels_durations;
  
  snooze(snoozeLabel,awakeLabel,timeLabels);  
}

function updateAfterSalesSnooze(){
  var config = Configuration.getCurrent();
  var snoozeLabel = config.gmailLabels_snoozeAfterSales;
  var awakeLabel = config.gmailLabels_awakeAfterSales;
  var timeLabels = config.gmailLabels_durations;

  snooze(snoozeLabel,awakeLabel,timeLabels);
}


// nag - require reply from customer within XX days
// move thread to inbox only if there was no reply from the customer to the thread within specified time period
function nag() {
  // label variables -- update to match those in gmail interface if required
  var config = Configuration.getCurrent();
  var nagLabel = config.gmailLabels_nag;
  var replyFailLabel = config.gmailLabels_chase;
  var timeLabels = config.gmailLabels_durations;
  var my_email_addresses = JSON.parse(PropertiesService.getScriptProperties().getProperty("email_addresses"));

  var allLabels = GmailApp.getUserLabels();
  var threads = GmailApp.getUserLabelByName(nagLabel).getThreads();
  
  for (var j = 0; j < threads.length; j++) {        
    // Last Date = Mon Oct 12 14:48:13 GMT+07:00 2015
    var threadLabels = threads[j].getLabels();
    var messages = threads[j].getMessages();
    var last_sender_email = getLastSenderEmail(messages[messages.length-1].getFrom());

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

        for (var k = 0; k < nagTimes.length; k++) {
          // remove all nage time labels
          threads[j].removeLabel(GmailApp.getUserLabelByName(nagTimes[k])); 
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