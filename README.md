# Toolkit for Dart

Toolkit for Dart for Adobe Flash Professional allows you to publish a FLA to HTML by generating Dart code leveraging the StageXL library.

* <http://toolkitfordart.github.io>
* <http://dartlang.org>
* <http://www.stagexl.org/>

## Sources organization

* **darttoolkit-extension/** - Extension sources
   * **defaultsettings.dat** - Toolkit version and settings defaults
   * **jsfl/** - JSFL scripts
   * **libs/** - Code generation includes
   * **locale/** - Localizable UI texts
   * **Toolkit_for_Dart.mxi_Resources/** - Installer localized descriptions
   * **Toolkit_for_Dart.mxi** - Installer configuration
   * **ui/** - SWF panels        
* **darttoolkit-panels/** - SWF panels sources
   * **dart-dialog/** - Toolkit settings dialog
   * **dart-panel/** - Toolkit panel

## Installing the extension directly from git

*Notice: change `en_US` to match your locale.*

### Mac OS

Open a Terminal and paste:

    cd ~/Library/Application Support/Adobe/Flash CC/en_US/Configuration
    git clone https://github.com/ToolkitForDart/darttoolkit-extension.git DartJS
    copy DartJS/ui/Toolkit\ for\ Dart.swf  WindowSWF/

### Windows

Open a Terminal and paste:

    cd "%LOCALAPPDATA%\Adobe\Flash CC\en_US\Configuration"
    git clone https://github.com/ToolkitForDart/darttoolkit-extension.git DartJS
    copy "DartJS\ui\Toolkit for Dart.swf" WindowSWF

## Compiling the SWF panels
*Note: the SWF panels are only used to configure the output, they don't hold any publishing logic.*

### Fonts

For perfect UI fidelity, make sure you have both required fonts available on your system:

* Lucida Grande (OSX UI)
* Tahoma (Windows UI) 

### Compilation:

The SWF panels require Adobe Flash Professional CS6+ for compilation.

Open and compile:

* **darttoolkit-panels/dart-panel/SettingsDialog.fla**
* **darttoolkit-panels/dart-dialog/DartExportPanel.fla**

The SWFs will be generated directly in the same folder as the FLA - you must copy them manually to the appropriate location.

## Packaging the extension

You will need Adobe Extension Manager CS6 (not CC) to create an installable ZXP extension:

* Open Extension Manager
* Select File > Package ZXP Extension
* Browse for **darttoolkit-extension/Toolkit_for_Dart.mxi**
* Choose a location to generate the ZXP file.
ê
