# UI Assets

The game loads images from this folder automatically. Put each file in the folder shown below, using the exact name, then refresh the page (restart `npm run dev` if it doesn't appear).

- **Formats:** `.jpg`, `.jpeg` or `.png`. Only the name matters, so the formats can be mixed.
- **Names:** lowercase, exactly as listed.
- **Missing files are fine:** a card without an image shows its name as text, and any other missing image is skipped or replaced by plain text. You can add files a few at a time.

```text
future assets/
├── cards/
└── ui/
```

## Cards: `cards/` (55 files)

Use a 2:3 portrait ratio, for example 400 × 600 px. Other ratios get cropped to fit.

There are 13 cards per color, 52 in total:

| Card | Red | Blue | Green | Yellow |
| :--- | :--- | :--- | :--- | :--- |
| 0 | `red-0` | `blue-0` | `green-0` | `yellow-0` |
| 1 | `red-1` | `blue-1` | `green-1` | `yellow-1` |
| 2 | `red-2` | `blue-2` | `green-2` | `yellow-2` |
| 3 | `red-3` | `blue-3` | `green-3` | `yellow-3` |
| 4 | `red-4` | `blue-4` | `green-4` | `yellow-4` |
| 5 | `red-5` | `blue-5` | `green-5` | `yellow-5` |
| 6 | `red-6` | `blue-6` | `green-6` | `yellow-6` |
| 7 | `red-7` | `blue-7` | `green-7` | `yellow-7` |
| 8 | `red-8` | `blue-8` | `green-8` | `yellow-8` |
| 9 | `red-9` | `blue-9` | `green-9` | `yellow-9` |
| Skip | `red-skip` | `blue-skip` | `green-skip` | `yellow-skip` |
| Reverse | `red-reverse` | `blue-reverse` | `green-reverse` | `yellow-reverse` |
| Draw 2 | `red-draw2` | `blue-draw2` | `green-draw2` | `yellow-draw2` |

Plus 3 more:

| Card | File name |
| :--- | :--- |
| Wild | `wild` |
| Wild Draw 4 | `wild-draw4` |
| Card back (draw pile and opponents' hands) | `back` |

For example, the red 7 is `future assets/cards/red-7.jpg`.

## Interface: `ui/` (8 files)

| Image | File name | Suggested size | Where it shows |
| :--- | :--- | :--- | :--- |
| Table background | `table` | 1920 × 1080 px | Behind every screen |
| Logo | `logo` | About 600 px wide | Setup screen and top bar |
| Your avatar | `avatar-player` | 200 × 200 px, cropped to a circle | Next to your hand |
| Bot avatar | `avatar-bot` | 200 × 200 px, cropped to a circle | Next to each bot (all bots share it) |
| Red token | `color-red` | 100 × 100 px | Active color and wild color picker |
| Blue token | `color-blue` | 100 × 100 px | Active color and wild color picker |
| Green token | `color-green` | 100 × 100 px | Active color and wild color picker |
| Yellow token | `color-yellow` | 100 × 100 px | Active color and wild color picker |

JPGs have no transparency, so the logo and tokens will show their background. Use PNGs for those if you want a see-through background.

## Sounds

Not used yet: the game doesn't play audio, so there's nothing to add here for now.
