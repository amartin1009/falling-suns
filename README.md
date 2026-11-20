# FALLING SUNS — Private Deck Website

Live at https://amartin1009.github.io/falling-suns/ (password protected).

- **Privacy:** visitors see only the night-drive background and a password box. The slides in `slides/` are AES-encrypted (`.bin`); they can't be viewed from GitHub without the password. The page is also marked `noindex` so search engines don't list it.
- **Background:** `bgcuts.js` cuts between real photos in `media/bg/` with handheld drift, passing-streetlight sweeps, flash frames and letterbox. Edit the `PHOTOS` list to change the shots. To use real driving footage instead, add `media/bg.mp4` and set `BG_VIDEO` in `index.html`.
- **Dashboard:** blurred real dashboard photo (`media/bg/pinkdash.jpg`) with a head unit for the music and slide counter (`dashboard.js`).
- **Music:** audio from the YouTube video *Nana - King's Blvd 2* (`YT_VIDEO` in `dashboard.js`), starting at 0:17 (`START_AT`) when someone pushes start, looping back to 0:17. The player stays hidden unless a browser blocks playback.
- **Video slides:** slides listed in `VIDEO_SLIDES` play as silent loops. Put `19.mp4`, `20.mp4` next to the JPGs before running the encrypt script.
- **Trailer:** set `TRAILER_URL` in `index.html` (YouTube/Vimeo link) to show the "Play me" button.

## Updating the slides or password
1. Export the deck as JPGs named 1.jpg, 2.jpg, …, in a folder **outside** this repository.
2. Run `python3 tools/encrypt_slides.py NEW_PASSWORD /path/to/jpgs` (needs `pip install cryptography`).
3. Paste the printed SALT / VERIFY values (and SLIDE_COUNT) into `index.html`, then commit.
Never commit the plain JPGs.
