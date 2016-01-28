// utility functions to run on the server

// indexOf checks if an item is contained within a list list
indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

function getLastSenderEmail(sender){
  try {
    // some emails are sent from "User Name <username@example.com>"
    // we only want the email address not the sender display name
    // we use regex to get just the email address part
    var last_sender_email = sender.match(/<(.*?)>/)[1]; 
    return last_sender_email;
  } catch(e){
    // other emails do not contain a display name
    // These are just: "username@example.com"
    // so we don't need to modify the string at all here
    var last_sender_email = sender;
    return last_sender_email;
  }
}

function filterTimeLabels(threadLabels,timeLabels) {
  var i, len, results;
  results = [];
  for (i = 0, len = threadLabels.length; i < len; i++) {
    var l = threadLabels[i].getName();
    if (indexOf.call(timeLabels, l) >= 0) {
      results.push(l);
    }
  }
  return results;
}

function sumTimeFromDateLabels(labels) {
  var sum = 0;
  var time = 0;
  var day = 24 * 60 * 60 * 1000;
  var week = 7 * day;
  var month = 30 * day; // an 'average' month
  var year = 365 * day;
  
  for (var i = 0; i < labels.length; i++) {
    var l = labels[i];
    var x = l.split('');

    if (x[1] === 'd'){
      time = parseInt(x[0]) * day;
    } else if (x[1] === 'w') {
      time = parseInt(x[0]) * week;
    } else if (x[1] === 'm') {
      time = parseInt(x[0]) * month;
    } else if (x[1] === 'y') {
      time = parseInt(x[0]) * year;
    }

    sum += time;
  }
  // sum is time in milliseconds
  return sum;
}


function getTimeBetweenDates(d1,d2){
  var millisecondsBetween = Math.abs(d1.getTime() - d2.getTime());
  return millisecondsBetween;
}

function getDaysBetweenDates(d1,d2) {
  var oneDayMilliseconds = 24*60*60*1000;
  
  var daysBetween = Math.round(Math.abs((d1.getTime() - d2.getTime())/oneDayMilliseconds));
  return daysBetween;
}
