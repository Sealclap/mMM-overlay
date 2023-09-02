# Installation Instructions
### 1. Install [BakkesMod](https://bakkesmod.com/download.php) and [Node.js](https://nodejs.org/en/download) 
---
### 2. Install `SOS` plugin
1. Navigate to `BakkesMod` installation folder and then to the `plugins` folder
> **Note:** You can do this by opening `BakkesMod` then clicking `File` -> `Open BakkesMod Folder`
2. In a separate window, navigate to the `requirements` -> `bakkesmod` folder within this directory.
3. Copy (or move) `SOS.dll` from `requirements/bakkesmod` folder to the `BakkesMod/plugins` folder.
4. Copy (or move) `sos.set` from `requirements/bakkesmod/settings` to `BakkesMod/plugins/settings` folder
5. Still in the `BakkesMod` installation folder, navigate to `BakkesMod` -> `cfg`
6. Open `plugins.cfg` in `Notepad` and add the following line to the file:
- `plugin load sos`
- Save and exit
### 3. Install `SOS-WS-Relay` dependencies
1. Navigate to the `sos-ws-relay-master` folder in this directory.
2. Click in the address bar, type `cmd` and press enter
3. In the `Command Prompt` window, type `npm install` or `npm -i` and press enter.
> **Note:** Installation of dependencies should only take a few seconds. You may close the `Command Prompt` window once installation is complete.
### 4. Installation complete
<br /><br />

# Using the Overlay
### 1. Insert `overlay.html` as a new browser source on `OBS`.
> **Note:** Manually set the resolution to `1280x720`, otherwise the overlay will not display properly.<br />[More info on OBS browser source](https://obsproject.com/kb/browser-source)
### 2. Start the `SOS-WS-Relay`
> **Note:** This can be done by opening the `overlay.bat` folder or by navigating to the `sos-ws-relay-master` folder, typing `cmd` in the address bar, and then typing `node ws-relay.js`<br />Then press `Enter` at the prompts (3x) to use default values
### 3. Start `BakkesMod` and `Rocket League`
### 4. Once `Rocket League` is loaded with `BakkesMod` injected, press `F6` to open the `BakkesMod console` and enter the following:
- `plugin load sos`
> **Note:** You can skip this step in the future by opening the `BakkesMod` installation folder, navigating to the `cfg` folder, and adding the line above into `plugins.cfg`
### 5. To change game number...
- Open the `game.js` file in this directory, change the number, and ***save***.
> **Note:** You may need to refresh your browser source cache in `OBS` to see the update. **It is recommended only to refresh the cache in between matches.**
<br /><br />
# Additional Notes
- **This overlay only works when `spectating private matches`.** There is nothing I can (or even would) do about this.
- Refreshing the cache during a match will only temporarily "break" the overlay. It will fix itself after the next goal or after the match ends.
- Updates may occur in the future should there be demand.
- If you have any questions or suggestions, feel free to contact me on `Discord` (username `Sealclap`)