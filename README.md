## mail-scripts
Simple Gmail helper scripts to be used with a priority inbox. 

The `threadsToInbox` is a time triggered function. The function ensures that new messages are placed within the appropriate priority inbox categories. Without this function, new messages get placed in the `everything else` category of a priority inbox.  

If you're not using a priority inbox, you can remove this function and the trigger created in the `setup` function.

## Setup
There are two ways to setup the mail-scripts for your inbox.

### Option 1 - Quickstart - copy + paste code
Create a new script file in your Drive folder. Copy code from `libs` and `server` and paste into the script file. These can be contained within separate files to mirror the structure of this project, or can be contained just one code file. Run the `setup` function to create triggers and save your email aliases if you have any to script properties. Finally,

### Option 2 - Developer Route - using `gapps` node module
Use the project [node-google-apps-script](https://www.npmjs.com/package/node-google-apps-script) to upload from the command line.

  1. run `npm install -g node-google-apps-script` to install it globally. This will allow you to run `gapps` from   command line (terminal).
  1. Get Google Credentials to authorize you to push to your revisions to a script file in your Drive. Follow   instructions on the [gapps node module readme](https://github.com/danthareja/node-google-apps-script#quickstart).
  1. Run `npm install -g gulp` if you do not already have the [gulp](http://gulpjs.com/) task runner installed   globally.
  1. Clone this repository, `cd mail-scripts`, and run `npm install`. This will download and set up all of the   local dependencies for the project that are specified in `package.json`.
  1. Create a new script file in your drive and copy the SCRIPT_DRIVE_FILE_ID from the url.
  1. Build the project for the specified environment (development: dev, production: prd, testing: tst). This script currenly only uses the `prd` environment, but more envs could be added for testing later:

  ```bash
  mkdir build
  cd build
  mkdir prd
  cd prd
  gapps init *SCRIPT_DRIVE_FILE_ID*
  cd ../..
  gulp upload-latest --env prd
  ```

## Make Labels in Gmail
Make labels in your inbox. If you're using the `snooze` and `nag` functions, then you will need at least the `snooze` and `nag` label along with some time/duration labels like `1d`,`1w`,`4w`, as specified in the script. 