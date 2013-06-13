# Toolkit for Dart

Toolkit for Dart for Adobe Flash Professional allows you to publish a FLA to HTML by generating Dart code leveraging the StageXL library.

* <http://toolkitfordart.github.io>
* <http://dartlang.org>
* <http://www.stagexl.org>

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
    copy DartJS/ui/Toolkit\ for\ Dart.swf  WindowSWF/

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
