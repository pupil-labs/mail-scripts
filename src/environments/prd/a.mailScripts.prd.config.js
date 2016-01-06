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

// mailscripts is a standalone script 
// therefore different environemnts are only required for debug messages and verbosity
// but we will put it here as a structure that could be used in the future if desired
/** @OnlyCurrentDoc */
// Put additional production configuration here
function provideEnvironmentConfiguration_(configuration) {
  configuration.sheets.logSheetId = '1BHqaOe7Ls8l6IbvLD2TJ7zSXtxmSce-n-_kQq8QvTD0';
  configuration.logLevel = 'WARNING';
  return configuration;
}