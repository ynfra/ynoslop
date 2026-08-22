---
runner: fixture
model: -
variant: baseline
recorded: 2026-08-21T00:00:00.000Z
---

Here are four friendly, user-centric error messages for `stak`! I've aimed for a
warm, empathetic tone that helps users feel supported rather than blamed. 😊

## 1. Bad Auth Token

```
❌ Oops! Something went wrong 😞

We're really sorry, but it looks like we weren't able to authenticate you
with the stak API. Don't worry — this happens to the best of us!

Our records show that the token stored in your ~/.stak/credentials file was
rejected by the API (HTTP 401 Unauthorized). This could potentially mean a
number of things: your token may have expired, it may have been revoked, or
it might have been rotated on another machine.

The good news is that this is usually an easy fix! Simply run `stak login`
and we'll walk you through generating a brand new token. You'll be back up
and deploying in no time! 🚀

(exit code: 4)
```

## 2. Network Timeout

```
⏳ Uh oh — we couldn't reach the stak API!

We tried our very best, but unfortunately we weren't able to get a response
from api.stak.dev within the 30 second timeout window while attempting to
push your deploy. We know how frustrating this can be, especially when
you're in the middle of shipping something exciting.

It's important to note that this could be caused by any number of factors,
including a slow network connection, a VPN or corporate proxy, or possibly a
temporary hiccup on our end. Rest assured, our team monitors availability
closely!

Please don't panic — your deploy was never actually started, so there's no
risk of a partial deployment. Feel free to give it another go whenever
you're ready! If your connection is on the slower side, you may also want to
consider bumping up the timeout using the handy --timeout flag.

Thanks so much for your patience! 🙏

(exit code: 7)
```

## 3. Unknown Flag

```
🤔 Hmm, we don't recognize that flag!

Sorry about that — it looks like `--stage` isn't a flag that `stak deploy`
knows about. No worries though, mistakes like this are super common and
easy to sort out!

You might be looking for a different flag. To see the full comprehensive
list of all the powerful options available to you, just run
`stak deploy --help` and we'll show you everything `stak deploy` can do.

Happy deploying! ✨

(exit code: 2)
```

## 4. Config File Not Parseable

```
📄 We had trouble reading your configuration!

Unfortunately, we weren't able to successfully parse your stak.toml file, so
we had to stop before doing anything else. We really appreciate you taking
the time to configure stak, and we're sorry this got in the way!

It appears there may be a syntax issue somewhere around line 12 of the file,
where a table header appears to have been opened but perhaps not closed as
expected. Double-checking your brackets is usually a great place to start!

Once you've had a chance to review and correct the file, simply try your
command again and everything should work seamlessly. 🎉

(exit code: 3)
```
