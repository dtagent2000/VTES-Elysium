// Elysium — Host Guide generator (v1.8). Rebuilds the whole document from source content
// so it can replace the old .docx. Mirrors v1.6's structure/content exactly, plus:
//  - new "Hosting on macOS & Linux" section (after Installation & start)
//  - new "Bring your own server" section (after Saving & loading a match)
//  - a short Mac/Linux launcher mention in the Cloudflare tunnel subsection
//  - a "Link invites" bullet in Rooms & lifecycle (the ?server=&room=&name= deep link)
//  - three new Troubleshooting rows (Gatekeeper / chmod / cloudflared-not-found)
//  - version bump 1.6 -> 1.7, 20 June 2026 -> 2 July 2026
//  v1.8 (same day): the Swedish onboarding twin is canonically STARTA-HAR.html (ASCII,
//  zip/cross-platform-safe) — the guide's mention updated to match the shipped file.
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  Header, Footer, PageNumber, TableOfContents, LevelFormat, VerticalAlign,
} = require("docx");

// ---------- tiny markdown-ish inline parser: **bold** and *italic* ----------
function runs(text, base) {
  base = base || {};
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(new TextRun({ text: tok.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: tok.slice(1, -1), italics: true, ...base }));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}
function P(text, opts) {
  opts = opts || {};
  return new Paragraph({ children: runs(text), spacing: { after: 160 }, ...opts });
}
function H1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 } });
}
function H2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
}
function Bul(text) {
  return new Paragraph({
    children: runs(text), spacing: { after: 120 },
    numbering: { reference: "bullets", level: 0 },
  });
}

// ---------- table helper ----------
function cell(text, opts) {
  opts = opts || {};
  return new TableCell({
    width: { size: opts.width || 50, type: WidthType.PERCENTAGE },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "2B2118" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [new Paragraph({
      children: runs(text, opts.header ? { bold: true, color: "FFFFFF" } : {}),
    })],
  });
}
function twoColTable(rows, w1, w2) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [Math.round(9638 * (w1 || 0.42)), Math.round(9638 * (1 - (w1 || 0.42)))],
    rows: rows.map((r, i) => new TableRow({
      children: [cell(r[0], { header: i === 0, width: (w1 || 0.42) * 100 }),
                 cell(r[1], { header: i === 0, width: (1 - (w1 || 0.42)) * 100 })],
    })),
  });
}

// ============================================================================
const body = [];

// ---- title block ----
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [new TextRun({ text: "ELYSIUM", bold: true, size: 56 })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "Host Guide", bold: true, size: 34, color: "6B5A3E" })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "The server, the network, and playing over the internet", italics: true, size: 22 })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
  children: [new TextRun({ text: "Version 1.8  ·  2 July 2026  ·  A digital table for Vampire: The Eternal Struggle", size: 20, color: "555555" })] }));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Contents", spacing: { after: 80 } }));
body.push(new Paragraph({ children: [new TextRun({ text: "(Open in Word and press Ctrl+A followed by F9 to populate the table of contents.)", italics: true, size: 20 })], spacing: { after: 200 } }));
body.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }));
body.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ---- Overview ----
body.push(H1("Overview"));
body.push(P("The Elysium server is a single file, elysium-server.js, with no dependencies at all — just Node. It holds the rooms, stores every hidden pile (library, crypt and hand never leave the server), relays the log, and **also serves the client**: anyone opening the server’s address in a browser gets the game immediately, always in the right version."));
body.push(P("**Just want pass-and-play? **Then you do not need this guide. **Hotseat** — several players taking turns at one screen — runs entirely in the single HTML file, with no server at all (see the Player Manual). This guide is for *networked* play, where a server holds the hidden piles and relays the table to remote players."));

// ---- Installation & start ----
body.push(H1("Installation & start"));
body.push(Bul("Install **Node.js** (LTS) from nodejs.org — next, next, done."));
body.push(Bul("Put start-elysium.bat in the same folder as elysium-server.js and elysium-vtes-bord.html."));
body.push(Bul("Double-click the bat file. The server window shows where the table is open."));
body.push(P("Manually, or as a fallback on any OS: node elysium-server.js [port] [clientfile] — default port 8123, stop with Ctrl+C. macOS and Linux have their own launcher scripts too — see “Hosting on macOS & Linux” below."));
body.push(P("**Important: **never double-click the .js file itself on Windows — it is then run by the ancient Windows Script Host and dies with “Invalid character, line 1” (in your system language). The bat file exists precisely to avoid this."));
body.push(P("The startup banner shows three lines: **Local** (your own machine), **Network** (the address you share with the table) and **Client** (which HTML file is being served)."));

// ---- NEW: Hosting on macOS & Linux ----
body.push(H1("Hosting on macOS & Linux"));
body.push(P("The server is plain zero-dependency Node.js, so it runs anywhere Node does — Windows, macOS, Linux. The client is a browser file and never cared about your OS."));
body.push(Bul("Install **Node.js** (LTS) from nodejs.org, or via a package manager — brew install node on a Mac, sudo apt install nodejs on Debian/Ubuntu."));
body.push(Bul("Put start-elysium.sh (and, on a Mac, start-elysium.command) in the same folder as elysium-server.js and elysium-vtes-bord.html."));
body.push(Bul("First time only: chmod +x start-elysium.sh start-elysium.command — or skip that and run it as bash start-elysium.sh. On a Mac you can then simply double-click the .command file; if Gatekeeper objects the first time, right-click → Open once."));
body.push(Bul("Players connect exactly as on Windows: http://<your-address>:8123 — the **Network** line in the startup banner is the same on every OS."));
body.push(P("For internet play, start-cloudflare-tunnel.sh (with start-cloudflare-tunnel.command as the Mac double-click wrapper) mirrors the Windows tunnel launcher described below: install cloudflared (brew install cloudflared on a Mac; the apt repo at pkg.cloudflare.com on Linux; or the GitHub release binary, saved next to the script and made executable), run the script, and share the https://….trycloudflare.com address it prints — it lands on your clipboard automatically where pbcopy or xclip is available. Everything this guide says about tunnels still applies: one address, no router ports, close the window to stop."));

// ---- Playing on a LAN ----
body.push(H1("Playing on a LAN"));
body.push(Bul("Start the server and read the **Network** line, e.g. http://192.168.1.42:8123."));
body.push(Bul("Everyone at the table opens that address in their browser — **no file needs to be passed around**."));
body.push(Bul("The join dialog already has the right server address pre-filled. Enter a name and the room password — play."));
body.push(P("If someone types the address by hand, :8123 is appended automatically when the port is missing."));

// ---- The Windows firewall ----
body.push(H1("The Windows firewall"));
body.push(P("The most common cause of “it won’t connect” — localhost works but the LAN is silently blocked:"));
body.push(Bul("The first time Node listens, Windows asks for access. If the dialog was dismissed: open Windows Security → Firewall & network protection → **Allow an app** → tick **Node.js** for **private** networks."));
body.push(Bul("Check that your WiFi is profiled as a **Private** network, not Public."));
body.push(Bul("The wildcard: guest networks and some mesh systems run *AP/client isolation*, blocking all device-to-device traffic — switch to the main network."));
body.push(P("On a Mac, the equivalent is a one-time prompt to allow incoming connections for node — click **Allow**."));
body.push(P("**The diagnosis: **if the *page* itself loads at http://server-ip:8123 from another device, the network and firewall are cleared — the game and the page travel through the same port."));

// ---- Playing over the internet ----
body.push(H1("Playing over the internet"));
body.push(H2("Tailscale — recommended"));
body.push(P("A free VPN mesh: you and the players install the app, you invite them to your network, and they connect to your Tailscale address (100.x.y.z:8123) exactly as on a LAN. Encrypted (WireGuard), no port forwarding, no exposure to the internet — the “friends around a table” trust model stays intact."));
body.push(H2("Cloudflare quick tunnel — zero installation for the guests"));
body.push(P("One command on the host machine: cloudflared tunnel --url http://localhost:8123 produces a public https address. Guests just open the link; the client automatically switches to an encrypted wss connection when the page is served over https."));
body.push(P("Elysium ships a launcher for this too, on every OS — start-cloudflare-tunnel.bat / .sh / .command — so you never have to type the command by hand (see “Hosting on macOS & Linux” above for the non-Windows versions)."));
body.push(H2("Opening a router port — advised against"));
body.push(P("Technically possible but not recommended: an open port is found by scanners within hours, and plain ws traffic sends the room password in clear text. The server is hardened, but for game nights Tailscale is the right road."));

// ---- The security model ----
body.push(H1("The security model"));
body.push(twoColTable([
  ["Protection", "Behaviour"],
  ["Room password", "Compared in constant time. A wrong password counts as a strike."],
  ["Lockout", "5 failed attempts per IP gives a 10-minute ban. Token reconnection is immune."],
  ["Rate limiting", "Max 80 messages per 10 s per connection — then disconnect."],
  ["Room creation", "Max 4 new rooms per IP per hour (loopback exempt — a host running locally is never throttled)."],
  ["Identity", "A token per browser tab (survives F5, dies with the tab). Name + password reclaims an offline seat; a name that is online can never be taken."],
  ["Hidden information", "Library, crypt and hand exist only in server memory. Face-down card names are stripped; the hand is never relayed, and is stored only as an encrypted blob the server cannot read (see Hand escrow)."],
  ["Sanitisation", "Every field passing through the server is cleaned and clamped (lengths, ranges, control characters)."],
  ["Connection cap", "Max 16 concurrent connections per remote IP (loopback exempt) blunts connection floods."],
  ["Passwords at rest", "Room passwords are stored only as a SHA-256 hash, in memory and in the persistence file — never in cleartext."],
  ["Hand escrow", "Your hand is encrypted in your browser with a key derived from the room password, so reconnecting (even after clearing your browser), taking over a seat, or loading a saved match restores your exact hand — while the server, the save file, and other players only ever see an opaque blob. Obfuscation-grade, not an audited cipher (see the technical document)."],
  ["Crash isolation", "Every message is handled in a guarded context; a single malformed message cannot take the server down or drop the rooms."],
  ["XSS defence", "Angle brackets are stripped from names and card names on the server, on top of the client escaping everything at render time."],
], 0.30));

// ---- Rooms & lifecycle ----
body.push(H1("Rooms & lifecycle"));
body.push(Bul("Max 6 seats per room and 50 rooms per server."));
body.push(Bul("A dropped connection keeps the seat (marked offline). A room where everyone has been offline for 60 minutes is cleaned up."));
body.push(Bul("Hosting (★) is inherited by the next player if the host leaves for good."));
body.push(Bul("The match clock lives on the room; the server calls “Time is called” once when it reaches zero."));
body.push(Bul("**Persistence: **rooms (including hidden piles, points, tokens and the encrypted hand blobs) are written to elysium-rooms.json every minute and on Ctrl+C. A restarted server restores everything; players token-reconnect as usual. The file is ignored if it is older than 24 h. **Named matches** you save by hand live separately in elysium-saves.json and never expire — see “Saving & loading a match”."));
body.push(Bul("**Spectators** require the room password, can only chat, and do not keep rooms alive."));
body.push(Bul("**Host tools: **as the host (★) you see a red ✕ on every player row in the Table dock — click it to remove someone from the table (confirmed first). The removed player is disconnected and the seat disappears; if they will not take the hint, change the room password. **📋 invite** in the room bar puts a ready-made invitation (address + room name) on the clipboard for Discord — send the password separately."));
body.push(Bul("**Link invites: **the client also accepts ?server=&room=&name= on its own address to pre-fill (and open) the join dialog automatically — handy for a one-click link instead of typed values. The password is deliberately never part of the link; share it separately, and the game never auto-joins from a link alone."));
body.push(Bul("**START-HERE.html: **include this file whenever you share Elysium — it opens in the browser and explains the guest, host and Tailscale paths pedagogically, with a troubleshooting table, now covering Windows, macOS and Linux. (Swedish twin: STARTA-HAR.html.)"));

// ---- Saving & loading a match ----
body.push(H1("Saving & loading a match"));
body.push(P("Beyond the automatic room snapshot (which expires after 24 h), the host can save a running match under a name and keep it indefinitely — to continue a game next week, or recover after a long break."));
body.push(H2("Saving"));
body.push(Bul("In a running game, click **💾 matches** in the room bar (host only)."));
body.push(Bul("Type a name (e.g. *Friday game*) and **Save match**. It is stored on the server and will not expire."));
body.push(P("A save captures every seat’s deck (the live library/crypt as they stand), public board, victory points and the turn — plus each player’s **encrypted hand**. The server stores the hand only as an opaque blob it cannot read."));
body.push(H2("Loading"));
body.push(Bul("Create a **fresh room** — and give it the **same password the match originally used** (the password is how a save is found and how the seats are protected)."));
body.push(Bul("Open **💾 matches**: saved matches made with that password appear in the list."));
body.push(Bul("Click **Load**. You step straight into your own seat (so log in with the name you played under); the other seats wait offline."));
body.push(Bul("Everyone else rejoins the new room with **their own name + the same password** and is dropped back into their seat — board, deck and hand restored."));
body.push(Bul("**Hands come back: **reconnecting, taking over a seat, and loading a match all restore the *exact* hand for anyone who knows the password — the headline of v1.2. A player who cleared their browser recovers their hand simply by rejoining with their name and the password."));
body.push(Bul("**The fine print: **a hand is restored from the encrypted blob only when the password is in play (i.e. it was just typed). A plain page refresh restores your hand from your browser’s own autosave instead. If a save is missing the password, the load is refused with the list of names that belong to it."));
body.push(Bul("**Privacy: **the save file never contains a hand in readable form, and hands are never shown to other players; the deck and pile contents are stored server-side in plaintext, as they always have been. The hand encryption is obfuscation-grade (see the technical document for the exact threat model)."));

// ---- NEW: Bring your own server ----
body.push(H1("Bring your own server"));
body.push(P("The client and the server talk over an open, documented contract — ELYSIUM-PROTOCOL.md. If you (or a friend with server chops) want to run Elysium behind your own infrastructure — a matchmaking site, a tournament bracket, a permanent community server — you do not need to touch the client at all."));
body.push(Bul("**Point the client anywhere: **the Server address field in Play online accepts any host, and the client file itself can be served from any static hosting. An https page connects with wss on 443 — put your endpoint behind any TLS proxy."));
body.push(Bul("**Deep-link players to the table: **?server=<address>&room=<room>&name=<player> on the client’s URL pre-fills and opens the Play-online dialog — one click from seated. The password is deliberately not part of the link (share it separately) and the game never auto-joins."));
body.push(Bul("**The contract is small on purpose: **a minimal server is a relay plus three real duties — hold the hidden piles, advance the turn, and store each player’s encrypted hand blob. The crypto is entirely client-side; your server just keeps an opaque string. The protocol document splits MUST from MAY and lists the security invariants to keep (derive the sender’s seat yourself, sanitise every field, and think about rate-limit keys behind a tunnel)."));
body.push(Bul("**Prove it with the shipped tests: **the test-2a…2g suites (about 195 assertions) run against any server that speaks the protocol — they are the conformance suite. A small companion script keeps the protocol document itself honest against the reference code."));
body.push(P("Tournament logic belongs *around* the table, not inside it: your pre-stage handles accounts, brackets and results, and Elysium stays the sandbox where the game is actually played."));

// ---- Troubleshooting ----
body.push(H1("Troubleshooting"));
body.push(twoColTable([
  ["Symptom", "Remedy"],
  ["“Invalid character, line 1” when double-clicking the .js", "Windows Script Host — run via the bat file or node in a terminal."],
  ["Works locally, not from other machines", "The firewall (Node, private networks), network profile Private, or AP isolation. Test whether the page loads."],
  ["“No such room” / “Wrong password”", "Room names are case-sensitive at creation; the password is set by the host."],
  ["“That name is taken”", "The name is online in the room. Offline seats are reclaimed with the same name + password."],
  ["“Too many failed attempts”", "Lockout — wait 10 minutes, or reconnect in the tab that holds the token."],
  ["Port busy at startup", "Start on another port: node elysium-server.js 8200 — and share the new address."],
  ["macOS: “…cannot be opened” for the .command file", "Gatekeeper being cautious with a new file — right-click it → Open → Open (needed once), or run bash start-elysium.sh from Terminal."],
  ["“Permission denied” running a .sh file", "Either prefix it — bash start-elysium.sh — or make it executable once: chmod +x start-elysium.sh."],
  ["“cloudflared: command not found” (macOS/Linux)", "brew install cloudflared on a Mac; the pkg.cloudflare.com repo on Linux — or save the release binary next to the script as ./cloudflared and chmod +x cloudflared."],
], 0.42));

// ============================================================================
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
                 style: { paragraph: { indent: { left: 420, hanging: 260 } } } }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22, color: "1B1B1B" },
                  paragraph: { spacing: { line: 276 } } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Calibri", size: 30, bold: true, color: "3A2F1D" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0,
                     border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "B08D4F" } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Calibri", size: 24, bold: true, color: "6B5A3E" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "ELYSIUM — HOST GUIDE", size: 16, color: "8A7A5C" })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Elysium v1.8 — Host Guide  ·  page ", size: 18, color: "555555" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "555555" }),
      ],
    })] }) },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("Elysium - Host Guide.docx", buf);
  console.log("wrote Elysium - Host Guide.docx", buf.length, "bytes");
});
