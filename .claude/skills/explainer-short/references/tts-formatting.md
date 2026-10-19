# TTS formatting for script.txt

Kokoro reads text literally. Before running `tts.py`:

- One sentence per line. Split a long sentence at the point where you want a cut.
- Spell out numbers that matter for rhythm: "a hundred hours", "two more moonwalks", "nineteen seventy-one". Plain digits like "12" are usually fine but "1,746" is safer as "one thousand seven hundred forty-six".
- Expand abbreviations: NASA is fine, "EVA" becomes "spacewalk" or "E V A", "km" becomes "kilometers", "°C" becomes "degrees Celsius".
- Units after numbers in words: "three kilometers", not "3 km".
- No URLs, hashtags, emoji, or parentheses.
- Avoid words the voice mangles: check the printed cue list for lines whose duration looks wrong and rephrase.
- Speed 1.0 to 1.1. Above 1.15 the voice sounds rushed; if the script is too long, cut words instead.
- Keep the whole thing 65 to 85 words for a 25 to 35 second Short; 90 words lands near 36 s.
