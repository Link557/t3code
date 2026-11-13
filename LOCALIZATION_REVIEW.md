# Simplified Chinese desktop prototype

This experimental branch targets T3 Code 0.1.9 (upstream `24e77473ecf4`). It adds an English / Simplified Chinese interface selector, translated application text and localized macOS menus. The separate local build uses its own app identifier and data directory and disables the official update feed.

The translation work builds on [ZhiweiXiao98/t3code](https://github.com/ZhiweiXiao98/t3code) at `35d7bddd7292a47abee0a12147b8cebde3a4635e`, with additional integration and translations. Coverage is still being checked; it should not be considered a complete upstream-ready localization.

The original desktop test showed the interface and native menu switching languages. The updated macOS build succeeds; its new translations and language persistence after restart still need desktop verification.

## Antigravity and SOCKS proxies

An Antigravity ACP session failed with `python-socks is required to use a SOCKS proxy`. This is tracked upstream in [t3code #16911](https://github.com/pingdotgg/t3code/issues/16911) and [antigravity-cli #1489](https://github.com/google-antigravity/antigravity-cli/issues/1489); this branch does not change the provider implementation.

As a local workaround, configure the Antigravity provider instance with `NO_PROXY=localhost,127.0.0.1,::1` and, when needed, explicit `HTTP_PROXY` and `HTTPS_PROXY` values for the user's HTTP proxy. Setting only `NO_PROXY` can suppress Python's discovery of macOS system proxy settings. An isolated ACP probe using all three variables loaded 10 models twice, though one earlier attempt failed; proxy availability and port changes still matter.
