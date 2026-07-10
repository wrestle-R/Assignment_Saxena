# AI Usage Report

I used AI heavily on this assignment, but I still reviewed the output and changed the parts that did not fit the data or the UI brief.

## Tools used

- GitHub Copilot Pro for quick scaffolding, small refactors, and copy suggestions.
- OpenCode with DeepSeek V4 Flash for backend and seed logic help.
- Antigravity with Gemini 3.1 Pro for frontend layout ideas and visual cleanup.

## AI vs hand-written split

My honest estimate is:

- AI-generated (minor edits): 99%
- Heavily edited / hand-written: 1%

I used the tools to move fast, then I edited the output so it matched the assignment instead of leaving it in a generic AI shape.

## Where AI was wrong and how I caught it

One early AI draft tried to treat blank `planned_units` as `0`. That would have polluted the clean data and produced fake exceptions, so I rejected it and kept those rows in `data_quality_issues` instead.

Another draft was too loose about duplicate plan rows and would have collapsed records in a way that hid real differences. I caught that by checking the CSV structure and the seed output, then I kept the duplicate handling strict.

The frontend was the same story. The first AI layout was too busy and decorative for the tone I wanted, so I stripped it back to a cleaner dashboard.

