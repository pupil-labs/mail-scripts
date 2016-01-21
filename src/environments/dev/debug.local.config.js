// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// For testing - broadens the OAuth scope to allow opening any
// Spreadsheet on the current user's Drive
/** @NotOnlyCurrentDoc */


/**
 * @param {myproj.json.Configuration} configuration
 *     The current configuration settings.
 * @return {myproj.json.Configuration} configuration
 *     The current configuration settings, updated with test settings.
 */
 function provideEnvironmentConfiguration_(configuration) {
  configuration.sheets.logSheetId =
      '1nPGo-IaxEQhbN8klrHcuj5mz4D5A0Yactd8KTMdodV0';
  configuration.debug = true;
  configuration.logLevel = 'DEBUG';
  configuration.gmailLabels_snooze = "snooze";
  configuration.gmailLabels_awake = "back from snooze";
  configuration.gmailLabels_nag = "nag";
  configuration.gmailLabels_chase = "customer failed to reply";
  configuration.gmailLabels_snoozeAfterSales = "snooze after-sale"
  configuration.gmailLabels_awakeAfterSales = "back from after-sale snooze"  
  configuration.gmailLabels_durations = ['1d','2d','3d','4d',
                                        '1w','2w','3w',
                                        '1m','2m','3m',
                                        '1y'];
  return configuration;
}
