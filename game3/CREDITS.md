# Zacky game 3 (lava) - asset credits

All assets were made for this game. No third-party audio, images or CC0 files were used, and nothing was copied from Paw Patrol or other games.

- Art (lava_title.jpg, lava_title_clean.jpg, lava_level1.jpg, lava_platform.png, lava_pool.png, lava_monster.png, gem.png, exit_door.png, friendly_character.png): generated with the built-in GenerateImage tool (free), with "no text, no letters" in the prompts. Cut-outs made with rembg (MIT licence) using the birefnet-general model. Resized with Pillow.
- Text on lava_title.jpg and friend_speech.png: rendered with headless Chrome. The friendly pup is an original Shiba Inu pup with a teal bandana, not a Paw Patrol character.
- Zacky_jump.png: unchanged copy of the Zacky_jump.png already used in game 2 (paw-patrol2/site). No new Zacky art was made.
- Music (Lava_Title_Music.mp3, Lava_Level_Music.mp3) and sound effects (jump, gem_collect, lava_hiss, level_complete): synthesised from scratch with Python (numpy and scipy) and encoded with ffmpeg (libmp3lame). Nothing was sampled. Generator scripts: /workspace/zacky3/work/audio.py and sfx.py.
- walking.mp3 is not included. The plan says to reuse it from game 2.

Round 2 additions (from /workspace/zacky3/assets/): biscuit_voice.mp3 (Biscuit's voice), zacky_car.png (the title car), a new lava_title.jpg / lava_title_clean.jpg, and lava_title_bg_nocar.jpg. title_bg.jpg is built from lava_title_bg_nocar.jpg plus the title text copied from lava_title.jpg (dev/make_title_bg.py).

Level 2 additions (from /workspace/zacky3/assets/level2/): lava_level2.jpg, celebration.png, Zacky_blaster.png, Zacky_blaster_walk.png, lava_monster_hot.png, lava_monster_cooled.png, water_blaster.png, water_blob.png, splash.png, lava_pool2.png, rock_bridge.png, water_spray.mp3, monster_cool.mp3, pickup.mp3, Lava_Level2_Music.mp3. Supplied for this game; none is from Paw Patrol or any other game. The key image in the "Press Enter to splash!" hint is drawn with CSS (no file).

Level 3 additions (from /workspace/zacky3/assets/level3/, full list and tools in that folder's CREDITS.md): volcano_chase_bg.jpg, volcano_glow.png, speed_lines.png, confetti.png, Zacky_run_front_1-4.png, Zacky_jump_front.png, Zacky_stumble_front.png, lava_wave.png, log.png, gap.png, safe_hill.png, sparkle.png, Chase_Music.mp3, volcano_rumble.mp3, stumble_boing.mp3, whoops_bounce.mp3, finish_cheer.mp3 (own work, made for this game; the sounds are synthesised). Level 3 reuses gem.png, jump.mp3 and gem_collect.mp3. There is no eruption clip: the still backdrop is used.

Real boing (CC0): boing.mp3 and stumble_boing.mp3 come from "BOING!" by Aeva on OpenGameArt (https://opengameart.org/content/boing), a large-spring boing played on an Arturia MicroFreak synthesiser, licence CC0 1.0 (public domain, credit not required but given here). boing.mp3 was trimmed to 1.3 s, faded and level-matched; stumble_boing.mp3 is the same recording pitched up about 26 percent and shortened. boing.mp3 replaces the earlier synthesised placeholder of the same name, so the lava bounce in levels 1 and 2 now uses it too.

Landing page music: landing/art/music.mp3 is "Storm" by Aylex, from Free To Use Music (free licence: https://freetouse.com/license). Attribution as Free To Use asks for it (their FAQ format):
Music from Free To Use
Source: https://freetouse.com/music
Storm by Aylex

Level 3 v2 additions (from /workspace/zacky3/assets/level3v2/, full list and tools in that folder's CREDITS.md): volcano_chase_bg_v2.jpg, volcano_glow_v2.png, smoke_puff.png, lava_spurt.png, rock_side.png, tree_side.png, post_side.png, bush_side.png, path_dash.png, lava_rock.png, lava_rock_small.png, lava_wave_plain.png, car_front_empty.png, Zacky_in_car_front.png, donut.png (art: built-in GenerateImage tool, cut out with rembg, finished with Pillow; path_dash.png and volcano_glow_v2.png drawn with Pillow/numpy), and the sounds donut_crunch.mp3, boost_whoosh.mp3, volcano_boom.mp3, volcano_rumble_loud.mp3, rock_launch.mp3, rock_roll.mp3, car_horn.mp3, car_whoosh.mp3 (synthesised with numpy/scipy and encoded with ffmpeg, so project-owned; no third-party audio or art). The title car zacky_car.png is reused unchanged. Nothing was copied from Paw Patrol or other games.
