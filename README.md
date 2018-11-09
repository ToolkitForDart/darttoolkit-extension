# Toolkit for Dart

Toolkit for Dart for Adobe Flash Professional allows you to publish a FLA to HTML by generating Dart code leveraging the StageXL library.

* <http://toolkitfordart.github.io>
* <http://dartlang.org>
* <http://www.stagexl.org>

#### October 2018 Update
 
* Toolkit for Dart now produces code compatible with Dart 2 and StageXL 1.4.0.
 
* Toolkit for Dart does not work with Adobe Animate CC, the follow-up product to Flash Professional. However, you can still install Flash Professional CC 2014.1 via Adobe's Creative Cloud Manager: [Help article](https://helpx.adobe.com/download-install/using/install-previous-version.html).
 

## Sources organization

* **defaultsettings.dat** - Toolkit version and settings defaults
* **jsfl/** - JSFL scripts
* **libs/** - Code generation includes
* **locale/** - Localizable UI texts
* **Toolkit_for_Dart.mxi_Resources/** - Installer localized descriptions
* **Toolkit_for_Dart.mxi** - Installer configuration
* **ui/** - SWF panels        

## Installing the extension directly from git

*Notice: change `en_US` to match your locale.*

### Mac OS

Open a Terminal and paste:

    cd ~/Library/Application Support/Adobe/Flash CC/en_US/Configuration
    git clone https://github.com/ToolkitForDart/darttoolkit-extension.git DartJS
    cp DartJS/ui/Toolkit\ for\ Dart.swf  WindowSWF/

### Windows

Open a Command Prompt and paste:

    cd "%LOCALAPPDATA%\Adobe\Flash CC\en_US\Configuration"
    git clone https://github.com/ToolkitForDart/darttoolkit-extension.git DartJS
    copy "DartJS\ui\Toolkit for Dart.swf" WindowSWF

## Modifying the SWF panels

See **darttoolkit-panels** project:

 * <https://github.com/ToolkitForDart/darttoolkit-panels>


## Packaging the extension

You will need Adobe Extension Manager CS6 (not CC) to create an installable ZXP extension:

* Open Extension Manager
* Select File > Package ZXP Extension
* Browse for **darttoolkit-extension/Toolkit_for_Dart.mxi**
* Choose a location to generate the ZXP file.


## Compatibility

The extension is developped for Flash CC but should be generally compatible with Flash CS6 
if you have installed **Toolkit for CreateJS**.

 * <http://www.adobe.com/products/flash/flash-to-html5.html>
 


