# Comparison
Each scenario consists of a JSON object before and after editing. The "**|**"-symbol signifies the cursor position from which to start editing.\
The "keys"-Section may contain TEXT which is dependent on the input and equal across editors. Hence it is not counted in the total key score. US keyboard layout is used as a baseline since that's what I and most programmers I know use. I realize Dvorak might shave off a few keypress here and there. 

## Insert property
```json
{
  "Charlie Kaufman": "Eternal Sunshine of the Spotless Mind|",
  "David Fincher": "Zodiac"
}
```
```json
{
  "Charlie Kaufman": "Eternal Sunshine of the Spotless Mind",
  "Christopher Nolan": "Memento",
  "David Fincher": "Zodiac"
}
```
|  | Keys | n
| --- | --- | ---
| **Syntactor** | `Enter` → TEXT → `Tab` → `s` → TEXT | 3
| **IntelliJ** | `Shift` + `Enter` → `Shift` + `'` → TEXT → `→` → `Shift` + `;` → `Space` → `Shift` + `'` → TEXT → `→` → `,` | 12
| **VIM** | `o` → `Shift` + `'` → TEXT → `Shift` + `'` → `Shift` + `;` → `→` → `Space` → `Shift` + `'` → TEXT → `Shift` + `'` → `,` | 14

## Delete Property
```json
{
  "|Charlie Kaufman": "Eternal Sunshine of the Spotless Mind",
  "Christopher Nolan": "Memento",
  "David Fincher": "Zodiac",
  "Michael Bay": "Transformers 7"
}
```
```json
{
  "Charlie Kaufman": "Eternal Sunshine of the Spotless Mind",
  "Christopher Nolan": "Memento",
  "David Fincher": "Zodiac"
}
```
|  | Keys | n
| --- | --- | ---
| **Syntactor** | `↓` → `↓` → `↓` → `Ctrl` + `d` | 5
| **IntelliJ** | `Page Down` → `↑` → `Ctrl` + `y` → `↑` → `End` → `Backspace` | 7
| **VIM** | `3` → `Enter` → `d` → `d` → `↑` → `End` → `Delete` | 7