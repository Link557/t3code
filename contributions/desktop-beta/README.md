# Desktop prototypes for T3 Code Beta 0.1.11

Each patch applies independently to upstream commit `59651c1761f6c63e9b6056839067066968e6a406`. The patches are provided as working examples for the linked discussions. The remote badge fix has its own PR against upstream main.

| Patch | What to try | Upstream |
| --- | --- | --- |
| [Project folders](folders.patch) | Open a project with more than five threads. Expand it, collapse the folder, and reopen it. If the selected thread is outside the first five, it stays visible in the preview. This Beta patch also includes the device badge. | [Five-thread preview](https://github.com/pingdotgg/t3code/discussions/40667), [device badge PR](https://github.com/pingdotgg/t3code/pull/40669) |
| [Empty submit](empty-submit.patch) | Delay the first send and press Enter again in an empty composer. The optional Chat preference suppresses the notice. A blocked draft containing text or a file still receives feedback. | [Chat preference](https://github.com/pingdotgg/t3code/discussions/40766) |
| [Inline edit](inline-edit.patch) | Edit an earlier message in its bubble while a separate draft is open. Send retries reuse the dispatch identity and the completed rewind. A recorded file change anywhere in the replaced turns brings up the file choice. | [Editing discussion](https://github.com/pingdotgg/t3code/discussions/31335), [related file-choice PR](https://github.com/pingdotgg/t3code/pull/27690) |
| [macOS usage menu](usage-menu.patch) | Enable the menu bar item in Appearance, minimize the window, and switch between Cost, Tokens, and Limits. The compact trends use the Usage page's chart calculation and filtered data. | [Usage widget discussion](https://github.com/pingdotgg/t3code/discussions/37680) |

To try one patch, download its raw file, then run the following from a clean checkout of the upstream repository. Substitute the path of the patch you downloaded.

```sh
git switch --detach 59651c1761f6c63e9b6056839067066968e6a406
git apply --check /path/to/usage-menu.patch
git apply /path/to/usage-menu.patch
```
