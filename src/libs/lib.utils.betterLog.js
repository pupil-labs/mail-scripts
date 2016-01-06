// original BetterLogger library attributed to Peter Herrmann: https://github.com/peterherrmann/BetterLog
// No license specified in the github repository
// Changes made to lib by Will Patera 

var BetterLogLevels = {
  CRITICAL: 50,
  ERROR: 40,
  WARNING: 30,
  INFO: 20,
  DEBUG: 10,
  NOTSET: 0
};

var BetterLog = {
  // globals
  sheet: false,
  SHEET_MAX_ROWS: 50000, //sheet is cleared and starts again
  SHEET_LOG_CELL_WIDTH: 1000, //
  SHEET_LOG_HEADER: 'Message layout: Date Time UTC-Offset MillisecondsSinceInvoked LogLevel Message. Use Ctrl↓ (or Command↓) to jump to the last row',
  DATE_TIME_LAYOUT: 'yyyy-MM-dd HH:mm:ss:SSS Z', //http://docs.oracle.com/javase/6/docs/api/java/text/SimpleDateFormat.html
  levels: BetterLogLevels,
  level: BetterLogLevels.INFO, //default to debug
  startTime: new Date(),
  counter: 0,

  // public methods
  useSpreadsheet: function(optKey, optSheetName){
    this.setLogSheet_(optKey,optSheetName);
    this.sheet.getRange(1,1).setValue(this.SHEET_LOG_HEADER);
    this.rollLogOver_();
    return this;
  },


  ////////////////////////////////////////////////////////////////////////////////////////////////
  // logger methods
  ////////////////////////////////////////////////////////////////////////////////////////////////
  critical: function(message,optValues){
    if(BetterLogLevels.CRITICAL <= this.level){
      this.log_({"message": (typeof message == 'string' || message instanceof String) ? Utilities.formatString.apply(this, arguments) : message,
            "level": currentLevel,
            "time": new Date(),
            "elapsedTime": this.getElapsedTime_()
           });
    }
    return this;
  },

  error: function(message,optValues){
    if(BetterLogLevels.ERROR >= this.level){
      this.log_({"message": (typeof message == 'string' || message instanceof String) ? Utilities.formatString.apply(this, arguments) : message,
            "level": currentLevel,
            "time": new Date(),
            "elapsedTime": this.getElapsedTime_()
           });
    }
    return this;
  },

  warning: function(message,optValues){
    if(BetterLogLevels.WARNING >= this.level){
      this.log_({"message": (typeof message == 'string' || message instanceof String) ? Utilities.formatString.apply(this, arguments) : message,
            "level": currentLevel,
            "time": new Date(),
            "elapsedTime": this.getElapsedTime_()
           });
    }
    return this;
  },


  info: function(message,optValues){
    if(BetterLogLevels.INFO >= this.level){
      this.log_({"message": (typeof message == 'string' || message instanceof String) ? Utilities.formatString.apply(this, arguments) : message,
            "level": currentLevel,
            "time": new Date(),
            "elapsedTime": this.getElapsedTime_()
           });
    }
    return this;
  },

  debug: function(message,optValues){
    if(BetterLogLevels.DEBUG >= this.level){
      this.log_({"message": (typeof message == 'string' || message instanceof String) ? Utilities.formatString.apply(this, arguments) : message,
            "level": currentLevel,
            "time": new Date(),
            "elapsedTime": this.getElapsedTime_()
           });
    }
    return this;
  },

  log: function(message, optValues) {
    var this_ = this;
    return this.info.apply(this_, arguments);
  },
  ////////////////////////////////////////////////////////////////////////////////////////////////
  // private class only methods
  ////////////////////////////////////////////////////////////////////////////////////////////////

  // core logging function
  log_: function(msg){
    this.counter++;
    // Logger.log(this.convertUsingDefaultPatternLayout_(msg));
    if (this.sheet) {
      this.logToSheet_(msg);
    }
  },

  stringToLevel_: function(str) {
    for (var name in this.levels) {
      if (name == str) {
        return this.levels[name];
      } 
    } 
  },

  // Returns the Level as a String
  levelToString_: function(lvl) {
    for (var name in this.levels) {
      if (this.levels[name] == lvl)
        return name;
    } 
  },

  //  rolls over the log if we need to
  rollLogOver_: function() {
    var rowCount = this.sheet.getLastRow();
    if (rowCount > this.SHEET_MAX_ROWS) {
      //copy the log
      var ss = this.sheet.getParent();
      var oldLog = ss.copy(ss.getName() + ' as at ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), this.DATE_TIME_LAYOUT));
      //add current viewers and editors to old log
      oldLog.addViewers(ss.getViewers());
      oldLog.addEditors(ss.getEditors());
      // prep the live log
      this.sheet.deleteRows(2, this.sheet.getMaxRows()-2);
      this.sheet.getRange(1,1).setValue(this.SHEET_LOG_HEADER);
      this.sheet.getRange("A2").setValue(['Log reached ' + rowCount + ' rows (MAX_ROWS is ' + this.SHEET_MAX_ROWS + ') and was cleared. Previous log is available here:']);
      this.sheet.appendRow([oldLog.getUrl()]);
    }
  },

  //logs to spreadsheet
  logToSheet_: function(msg) {
    //check for rollover every 100 rows logged during one invocation
    if (this.counter % 100 === 0) {
      this.rollLogOver_();
    }
    var s = this.sheet;
    msgConverted = this.convertUsingSheetPatternLayout_(msg);
    this.call_(function() {s.appendRow([msgConverted]);});
  },

  // convert message to text string
  convertUsingDefaultPatternLayout_: function(msg) {
    var dt = Utilities.formatDate(msg.time, Session.getScriptTimeZone(), this.DATE_TIME_LAYOUT);
    var message = dt + " " + this.pad_(msg.elapsedTime,6) + " " + this.levelToString_(msg.level) + " " + msg.message;
    return message;
  }, 

  // convert message to text string
  convertUsingSheetPatternLayout_: function(msg) {
    return this.convertUsingDefaultPatternLayout_(msg);
  },

  //Sets the log sheet, creating one if it doesn't exist
  setLogSheet_: function(optKey, optSheetName) {
    var sheetName = optSheetName || "Log";
    var ss = (optKey) ? SpreadsheetApp.openById(optKey) : SpreadsheetApp.getActiveSpreadsheet();
    var sheets = this.call_(function() {return ss.getSheets();});
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName() === sheetName) {
        this.sheet = sheets[i];
        return;
      }
    }
    this.sheet = ss.insertSheet(sheetName, i);
    this.sheet.deleteColumns(2,this.sheet.getMaxColumns()-1);
    this.sheet.getRange(1,1).setValue(this.SHEET_LOG_HEADER);
    this.sheet.setFrozenRows(1);
    this.sheet.setColumnWidth(1, this.SHEET_LOG_CELL_WIDTH);
    this.info("Log created");
  },

  //gets the time since the start of logging
  getElapsedTime_: function(){
    return (new Date() - this.startTime); //milliseconds
  },

  // pads a number with leading zeros
  pad_: function(n,len) {
    var s = n.toString();
    if (s.length < len) {
      s = ('0000000000' + s).slice(-len);
    } 
    return s;
  },

  setLevel: function(strLevel){
    this.level = BetterLogLevels[strLevel];
  },

  //copy version 10 lib GASRetry 'MGJu3PS2ZYnANtJ9kyn2vnlLDhaBgl_dE' (changed function name and log line)
  call_: function(func, optLoggerFunction) {
    for (var n=0; n<6; n++) {
      try {
        return func();
      } catch(e) {
        if (optLoggerFunction) {optLoggerFunction("call_ " + n + ": " + e);}
        if (n == 5) {
          throw e;
        } 
        Utilities.sleep((Math.pow(2,n)*1000) + (Math.round(Math.random() * 1000)));
      }    
    }
  }
};


