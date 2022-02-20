![Lexogrine ARG](assets/githubLogo.png?raw=true)
# Lexogrine Auto Replay Generator

Lexogrine Auto Replay Generator is an extension for Lexogrine HUD Manager (2.4+), allowing users to automate replays during their CS:GO broadcasts using vMix


# Setup
To use this properly, you need 2 PCs connected to differently delayed GOTVs of the same match (7 seconds of delay difference would be best). On PC#1 (live game) you should have Lexogrine HUD Manager 2.4 or newer, while PC#2 (delayed relative to PC#1) should handle vMix Instant Replays and have ARG installed. Additionally, PC#2 should be opened with HLAE, as this is crucial to switch between players.

vMix setup is up to the user.

LARG 1.1 requires LHM 2.5.2+

If your setup has 3+ PCs, it is advised to use CS:GOs and vMix on separate different machines for performance reasons. The only difference from the usual setup is having vMix on another PC and setting vMix IP address at `%appdata%/auto-replay-generator/config.json`.

# Connecting

To connect both PCs you just need to put ARGs ID to LHM and click connect. ARG app on PC#2 should update its status to online. After you connected both PCs to GOTV you should execute command shown by ARG in CS:GO's console on PC#2.

If vMix's Instant Replay is correctly setup on PC#2, it should start changing observed player on its own, clipping kills, and playing it to output after round's end.

## Download

[Latest release](https://github.com/lexogrine/auto-replay-generator/releases/latest)
## Preview
![Lexogrine ARG](assets/preview1.jpg?raw=true)
