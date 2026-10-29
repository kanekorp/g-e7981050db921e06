# Zacky game 3 (lava) - asset credits

All assets were made for this game. No third-party audio, images or CC0 files were used, and nothing was copied from Paw Patrol or other games.

- Art (lava_title.jpg, lava_title_clean.jpg, lava_level1.jpg, lava_platform.png, lava_pool.png, lava_monster.png, gem.png, exit_door.png, friendly_character.png): generated with the built-in GenerateImage tool (free), with "no text, no letters" in the prompts. Cut-outs made with rembg (MIT licence) using the birefnet-general model. Resized with Pillow.
- Text on lava_title.jpg and friend_speech.png: rendered with headless Chrome. The friendly pup is an original Shiba Inu pup with a teal bandana, not a Paw Patrol character.
- Zacky_jump.png: unchanged copy of the Zacky_jump.png already used in game 2 (paw-patrol2/site). No new Zacky art was made.
- Music (Lava_Title_Music.mp3, Lava_Level_Music.mp3) and sound effects (jump, gem_collect, lava_hiss, level_complete): synthesised from scratch with Python (numpy and scipy) and encoded with ffmpeg (libmp3lame). Nothing was sampled. Generator scripts: /workspace/zacky3/work/audio.py and sfx.py.
- walking.mp3 is not included. The plan says to reuse it from game 2.

Round 2 additions (from /workspace/zacky3/assets/): biscuit_voice.mp3 (Biscuit's voice), zacky_car.png (the title car), a new lava_title.jpg / lava_title_clean.jpg, and lava_title_bg_nocar.jpg. title_bg.jpg is built from lava_title_bg_nocar.jpg plus the title text copied from lava_title.jpg (dev/make_title_bg.py).

Level 2 additions (from /workspace/zacky3/assets/level2/): lava_level2.jpg, celebration.png, Zacky_blaster.png, Zacky_blaster_walk.png, lava_monster_hot.png, lava_monster_cooled.png, water_blaster.png, water_blob.png, splash.png, lava_pool2.png, rock_bridge.png, water_spray.mp3, monster_cool.mp3, pickup.mp3, Lava_Level2_Music.mp3. Supplied for this game; none is from Paw Patrol or any other game. The key image in the "Press Enter to splash!" hint is drawn with CSS (no file).
