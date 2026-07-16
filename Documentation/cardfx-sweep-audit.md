# cardfx v1.4.0 sweep-audit — persistent + lock (14 juli 2026)

Genererad mot verklig `vtes.json` (4149 kort) + `cardfx-curated.json` (4 curated entries, 4 lib-poster). Syfte: kunna scrolla igenom HELA träffytan innan den litas på, inte bara ett sample.

Regenerera med: `node gen-sweep-audit.js` (kräver `vtes.json` + `cardfx-curated.json` i samma katalog).

## Sammanfattning

| | Antal |
|---|---:|
| lib-entries totalt | 2364 |
| persistent (alla typer) | 1194 |
| lock (alla typer, entries med minst 1 lock-mode) | 149 |
| Masters totalt | 525 |
| Masters — persistent | 418 (80%) |
| Masters — lock-gated | 90 |
| Masters — persistent men ingen lock (Passive-kandidater) | 330 |

## Kända uppföljningar

Curated-tier (`cardfx-curated.json`) skriver över hela auto-entryn, så dessa 4 kort får INTE
de nya taggarna automatiskt trots att deras egen text skulle matcha — de behöver `persistent`/`lock`
tillagt för hand om ni vill ha full konsekvens mellan tiers:

- **Blood Doll** — skulle fått persistent:true om den vore auto-tier idag.
- **Vessel** — skulle fått persistent:true om den vore auto-tier idag.
- **Dreams of the Sphinx** — skulle fått persistent:true + lock:true om den vore auto-tier idag.
- **Inside Dirt** — skulle INTE fått persistent om den vore auto-tier idag.

## Kluriga edge-cases hittade under granskningen

Dessa slog inte igenom av misstag i produktionskörningen (redan fixade och gate-testade),
men listas här så ni kan syna resonemanget direkt utan att behöva läsa diff:en.

**Negerad lock ("do/does not lock this/that X") — 11 kort, alla korrekt UTAN lock på den negerade sidan:**

| Kort | Negerad textsnutt |
|---|---|
| Council of Seraphim | …attempt fails (do not lock that vampire). That vampire… |
| Deflection | …As above, but do not lock this vampire.… |
| Devil-Channel: Throat | …attempt fails (do not lock that minion). That minion… |
| Foul Blood | …As above, but do not lock this reacting vampire.… |
| Gift of Sleep | …d the action. (Do not lock this vampire if they are bl… |
| Mental Maze | …As above, but do not lock this vampire.… |
| Obedience | …d the action. (Do not lock this vampire if they are bl… |
| Promise of 1528 | …d the action. (Do not lock this vampire if they are bl… |
| Shattered Mirror | …As above, but do not lock this vampire.… |
| Siren's Lure | …el] above, but do not lock this modifying vampire.… |
| Touch of Clarity | …As above, but do not lock this vampire.… |

**Deflection och Devil-Channel: Throat är spegelbilder av varandra:** Deflections [dom] kostar
en lock, [DOM] ("As above, but do not lock this vampire") tar bort kostnaden. Devil-Channel: Throats
[abo] har INGEN lock ("do not lock that minion"), men [ABO] ("As above, but lock that blocking minion")
LÄGGER TILL en lock som inferior-läget saknar — motsatt riktning, båda korrekt hanterade.

**Känd, accepterad miss (inte en felaktig tagg):** Gift of Sleep har både en genuin "Lock that ally"
(dess egen [obe]-reaktionsmode) OCH en orelaterad "do not lock this vampire"-påminnelse i SAMMA segment.
If/else-if-strukturen låter negationen vinna, så ally-låsningen missas helt (ingen mode alls för det läget)
— en miss, inte en felaktig tagg, i linje med auto-nivåns uttalade tolerans (se cardfx-design.md §6).

## Alla 525 Masters — persistent / lock-status

`—` = nej. Reason-kolumnen visar VILKET mönster som slog till för persistent.

| Kort | Persistent | Grund | Lock |
|---|:---:|---|:---:|
| Abombwe | ✓ | put-in-play / put-on / stays-in-play | — |
| Absolution of the Diabolist | — |  | — |
| Academic Hunting Ground | ✓ | location (first line) | — |
| Achilles' Heel | ✓ | put-in-play / put-on / stays-in-play | — |
| Aching Beauty | ✓ | put-in-play / put-on / stays-in-play | — |
| Acquired Ventrue Assets | ✓ | put-in-play / put-on / stays-in-play | — |
| Agent of Power | ✓ | put-in-play / put-on / stays-in-play | — |
| Aggressive Tactics | ✓ | put-in-play / put-on / stays-in-play | — |
| Al's Army Apparatus | ✓ | location (first line) | ✓ |
| Alamut | ✓ | location (first line) | — |
| Alvusia | ✓ | put-in-play / put-on / stays-in-play | — |
| Amusement Park Hunting Ground | ✓ | location (first line) | — |
| Anachronism | ✓ | put-in-play / put-on / stays-in-play | — |
| Anarch Railroad | ✓ | location (first line) | ✓ |
| Anarch Revolt | ✓ | put-in-play / put-on / stays-in-play | — |
| Anarch Troublemaker | ✓ | put-in-play / put-on / stays-in-play | — |
| Ancestor Spirit | ✓ | put-in-play / put-on / stays-in-play | — |
| Angel of Berlin | — |  | — |
| Animalism | ✓ | put-in-play / put-on / stays-in-play | — |
| Antediluvian Awakening | ✓ | put-in-play / put-on / stays-in-play | — |
| Arcane Library | ✓ | location (first line) | ✓ |
| Arcanum Chapterhouse, Alexandria | ✓ | location (first line) | — |
| Archon Investigation | — |  | — |
| Art Museum | ✓ | location (first line) | ✓ |
| Artistically Inept | ✓ | put-in-play / put-on / stays-in-play | — |
| Ascendance | — |  | — |
| Ashur Tablets | ✓ | put-in-play / put-on / stays-in-play | — |
| Asylum Hunting Ground | ✓ | location (first line) | — |
| Auspex | ✓ | put-in-play / put-on / stays-in-play | — |
| Aye | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Backways | ✓ | location (first line) | — |
| Base Hunting Ground | ✓ | location (first line) | — |
| Bastille Opera House | ✓ | location (first line) | ✓ |
| Battle Frenzy | — |  | — |
| Bay and Howl | — |  | — |
| Bestial Visage | ✓ | put-in-play / put-on / stays-in-play | — |
| Betrayer | ✓ | put-in-play / put-on / stays-in-play | — |
| Biotech Company Hunting Ground | ✓ | location (first line) | — |
| Black Forest Base | ✓ | location (first line) | — |
| Black Market Cache | ✓ | location (first line) | — |
| Bleeding the Vine | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Blessed Resilience | — |  | — |
| Blessing of the Beast | ✓ | put-in-play / put-on / stays-in-play | — |
| Blessings of the Loa | ✓ | put-in-play / put-on / stays-in-play | — |
| Blind Spot | — |  | — |
| Blood Buff | ✓ | put-in-play / put-on / stays-in-play | — |
| Blood Doll | — |  | — |
| Blood Puppy | ✓ | put-in-play / put-on / stays-in-play | — |
| Blood Turnip | ✓ | put-in-play / put-on / stays-in-play | — |
| Blooding by the Code | ✓ | put-in-play / put-on / stays-in-play | — |
| Bounty | ✓ | put-in-play / put-on / stays-in-play | — |
| Brainwash | ✓ | put-in-play / put-on / stays-in-play | — |
| Bravo | ✓ | put-in-play / put-on / stays-in-play | — |
| Brothers Grimm | ✓ | put-in-play / put-on / stays-in-play | — |
| Brujah Debate | ✓ | put-in-play / put-on / stays-in-play | — |
| Brujah Frenzy | — |  | — |
| Burden the Mind | ✓ | put-in-play / put-on / stays-in-play | — |
| Bureaucratic Overload | ✓ | put-in-play / put-on / stays-in-play | — |
| Burial Site Hunting Ground | ✓ | location (first line) | — |
| Cadet | ✓ | put-in-play / put-on / stays-in-play | — |
| Cairo Int'l Airport | ✓ | location (first line) | — |
| Camarilla Conclave | ✓ | put-in-play / put-on / stays-in-play | — |
| Campground Hunting Ground | ✓ | location (first line) | — |
| Capitalist | ✓ | put-in-play / put-on / stays-in-play | — |
| Cappadocian Crypt | ✓ | location (first line) | ✓ |
| Carfax Abbey | ✓ | location (first line) | — |
| Carnivale | ✓ | put-in-play / put-on / stays-in-play | — |
| Carthage Remembered | ✓ | put-in-play / put-on / stays-in-play | — |
| Carver's Meat Packing and Storage | ✓ | location (first line) | — |
| Cavalier | ✓ | put-in-play / put-on / stays-in-play | — |
| Cave of Apples | ✓ | location (first line) | — |
| Celerity | ✓ | put-in-play / put-on / stays-in-play | — |
| Census Taker | ✓ | put-in-play / put-on / stays-in-play | — |
| Centralized Background Check | ✓ | location (first line) | — |
| Chanjelin Ward | ✓ | put-in-play / put-on / stays-in-play | — |
| Channel 10 | ✓ | location (first line) | ✓ |
| Chantry | ✓ | location (first line) | ✓ |
| Charisma | ✓ | put-in-play / put-on / stays-in-play | — |
| Children of Osiris | ✓ | put-in-play / put-on / stays-in-play | — |
| Chimerstry | ✓ | put-in-play / put-on / stays-in-play | — |
| Church of the Order of St. Blaise | ✓ | location (first line) | ✓ |
| City Gangrel Connections | ✓ | location (first line) | — |
| Club Illusion | ✓ | location (first line) | — |
| Club Zombie | ✓ | location (first line) | — |
| Code of Samiel | ✓ | put-in-play / put-on / stays-in-play | — |
| Command Performance | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Communal Haven: Cathedral | ✓ | location (first line) | ✓ |
| Communal Haven: Temple | ✓ | location (first line) | — |
| Conductor | ✓ | put-in-play / put-on / stays-in-play | — |
| Conniver | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Contingency Planning | — |  | — |
| Contract | ✓ | put-in-play / put-on / stays-in-play | — |
| Convergence | — |  | — |
| Coroner's Contact | — |  | — |
| Corporal Reservoir | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Corporate Hunting Ground | ✓ | location (first line) | — |
| Cracking the Wall | — |  | — |
| Creep Show | ✓ | put-in-play / put-on / stays-in-play | — |
| Creepshow Casino | ✓ | location (first line) | ✓ |
| Crematorium | ✓ | location (first line) | — |
| Cultivated Blood Shortage | ✓ | put-in-play / put-on / stays-in-play | — |
| Curmudgeon | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Curse of Nitocris | ✓ | put-in-play / put-on / stays-in-play | — |
| Cursed Abattoir | ✓ | location (first line) | — |
| Dabbler | ✓ | put-in-play / put-on / stays-in-play | — |
| Danse Macabre | — |  | — |
| Dark Influences | ✓ | put-in-play / put-on / stays-in-play | — |
| Dead Pool | ✓ | put-in-play / put-on / stays-in-play | — |
| Deal with the Devil | — |  | — |
| Dementation | ✓ | put-in-play / put-on / stays-in-play | — |
| Demonstration | ✓ | put-in-play / put-on / stays-in-play | — |
| Depravity | ✓ | put-in-play / put-on / stays-in-play | — |
| Detection | ✓ | put-in-play / put-on / stays-in-play | — |
| Development | — |  | — |
| Día de los Muertos | — |  | — |
| Direct Intervention | — |  | — |
| Dirty Contract | ✓ | put-in-play / put-on / stays-in-play | — |
| Dis Pater | ✓ | put-in-play / put-on / stays-in-play | — |
| Dominate | ✓ | put-in-play / put-on / stays-in-play | — |
| Dominion | ✓ | put-in-play / put-on / stays-in-play | — |
| Dreams of the Sphinx | — |  | — |
| Drop Point Network | — |  | — |
| Dummy Corporation | ✓ | location (first line) | — |
| Ebony Fox Hunt | — |  | — |
| Ecoterrorists | ✓ | location (first line) | — |
| Effective Management | — |  | — |
| Elder Library | ✓ | location (first line) | — |
| Elysian Fields | ✓ | location (first line) | ✓ |
| Elysium: Sforzesco Castle | ✓ | location (first line) | ✓ |
| Elysium: The Arboretum | ✓ | location (first line) | ✓ |
| Elysium: The Palace of Versailles | ✓ | location (first line) | ✓ |
| Emergency Preparations | — |  | — |
| Ennoia's Theater | ✓ | location (first line) | — |
| Ephor | ✓ | put-in-play / put-on / stays-in-play | — |
| Esgrima | ✓ | put-in-play / put-on / stays-in-play | — |
| Extremis Boon | ✓ | put-in-play / put-on / stays-in-play | — |
| Failsafe | ✓ | put-in-play / put-on / stays-in-play | — |
| Fame | ✓ | put-in-play / put-on / stays-in-play | — |
| Family Gathering | — |  | — |
| Fear of Mekhet | ✓ | put-in-play / put-on / stays-in-play | — |
| Feral Spirit | ✓ | put-in-play / put-on / stays-in-play | — |
| Ferraille | ✓ | put-in-play / put-on / stays-in-play | — |
| Festivo dello Estinto | ✓ | put-in-play / put-on / stays-in-play | — |
| Fetish Club Hunting Ground | ✓ | location (first line) | — |
| Filchware's Pawn Shop | ✓ | location (first line) | — |
| Flames of Insurrection | ✓ | put-in-play / put-on / stays-in-play | — |
| Fleshforge Chamber | ✓ | location (first line) | — |
| Forest of Shadows | ✓ | location (first line) | ✓ |
| Fortitude | ✓ | put-in-play / put-on / stays-in-play | — |
| Fortschritt Library | — |  | — |
| Fortune Teller Shop | ✓ | location (first line) | ✓ |
| Forward Momentum | ✓ | put-in-play / put-on / stays-in-play | — |
| Foundation Exhibit | ✓ | location (first line) | — |
| Fragment of the Book of Nod | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Framing an Ancient Grudge | — |  | — |
| Frenzy | — |  | — |
| From a Sinking Ship | — |  | — |
| Frontal Assault | ✓ | put-in-play / put-on / stays-in-play | — |
| Galaric's Legacy | ✓ | put-in-play / put-on / stays-in-play | — |
| Gambit Accepted | ✓ | put-in-play / put-on / stays-in-play | — |
| Game of Malkav | — |  | — |
| Gang Territory | ✓ | location (first line) | — |
| Gangrel Atavism | ✓ | put-in-play / put-on / stays-in-play | — |
| Gangrel Conspiracy | — |  | — |
| Gangrel Revel | ✓ | put-in-play / put-on / stays-in-play | — |
| Garibaldi-Meucci Museum | ✓ | location (first line) | ✓ |
| Giant's Blood | — |  | — |
| Gift of Experience | — |  | ✓ |
| Giovanni Discrimination | ✓ | put-in-play / put-on / stays-in-play | — |
| Gird Minions | — |  | — |
| Glass Walker Pact | ✓ | put-in-play / put-on / stays-in-play | — |
| Glutton | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Golconda: Inner Peace | — |  | — |
| Goodnight, Sweet Prince | — |  | — |
| Grand Temple of Set | ✓ | location (first line) | — |
| Great Symposium | — |  | — |
| Grooming the Protégé | — |  | — |
| Guardian Angel | ✓ | put-in-play / put-on / stays-in-play | — |
| Guide and Mentor | ✓ | put-in-play / put-on / stays-in-play | — |
| Guinea-Bissau Carnival | ✓ | put-in-play / put-on / stays-in-play | — |
| Gurchon Hall | ✓ | location (first line) | — |
| Guru | ✓ | put-in-play / put-on / stays-in-play | — |
| Hackerspace | ✓ | location (first line) | — |
| Hand Contract | ✓ | put-in-play / put-on / stays-in-play | — |
| Hanging Fermata | — |  | — |
| Haqim's Law: Judgment | ✓ | put-in-play / put-on / stays-in-play | — |
| Haqim's Law: Retribution | ✓ | put-in-play / put-on / stays-in-play | — |
| Haven Affinity | ✓ | put-in-play / put-on / stays-in-play | — |
| Haven Uncovered | ✓ | put-in-play / put-on / stays-in-play | — |
| Heartblood of the Clan | ✓ | location (first line) | — |
| Heidelberg Castle, Germany | ✓ | location (first line) | — |
| High Museum of Art, Atlanta | ✓ | location (first line) | — |
| Hospital Food | ✓ | location (first line) | — |
| Hostile Takeover | — |  | — |
| Houngan | ✓ | put-in-play / put-on / stays-in-play | — |
| House of Sorrow | ✓ | location (first line) | — |
| Humanitas | ✓ | put-in-play / put-on / stays-in-play | — |
| Illegal Search and Seizure | — |  | — |
| In Memory of the Two Lands | ✓ | put-in-play / put-on / stays-in-play | — |
| Inbase Discotek, Frankfurt | ✓ | location (first line) | — |
| Inceptor | ✓ | put-in-play / put-on / stays-in-play | — |
| Infamous Insurgent | ✓ | put-in-play / put-on / stays-in-play | — |
| Infamous Warlock | ✓ | put-in-play / put-on / stays-in-play | — |
| Infernal Pact | ✓ | put-in-play / put-on / stays-in-play | — |
| Information Highway | ✓ | location (first line) | — |
| Information Network | ✓ | put-in-play / put-on / stays-in-play | — |
| Instability | — |  | — |
| Institution Hunting Ground | ✓ | location (first line) | — |
| Insurance Scam | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Into the Fire | — |  | — |
| Ishtarri Warlord | ✓ | put-in-play / put-on / stays-in-play | — |
| Island of Yiaros | ✓ | location (first line) | — |
| Jake Washington | ✓ | put-in-play / put-on / stays-in-play | — |
| Joseph Pander | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Jungle Hunting Ground | ✓ | location (first line) | — |
| Kaymakli Nightmares | — |  | — |
| Khobar Towers, Al-Khubar | ✓ | location (first line) | — |
| Kindred Society Games | ✓ | put-in-play / put-on / stays-in-play | — |
| King's Rising | ✓ | put-in-play / put-on / stays-in-play | — |
| Kingston Penitentiary, Ontario | ✓ | location (first line) | ✓ |
| KRCG News Radio | ✓ | location (first line) | ✓ |
| Kumpania | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Last Stand | ✓ | put-in-play / put-on / stays-in-play | — |
| Lazarene Inquisitor | ✓ | put-in-play / put-on / stays-in-play | — |
| Leadership Vacuum | ✓ | put-in-play / put-on / stays-in-play | — |
| Left for Dead | ✓ | put-in-play / put-on / stays-in-play | — |
| Legacy of Caine | ✓ | put-in-play / put-on / stays-in-play | — |
| Legendary Vampire | ✓ | put-in-play / put-on / stays-in-play | — |
| Lesser Boon | ✓ | put-in-play / put-on / stays-in-play | — |
| Letter from Vienna | — |  | — |
| Libertas | ✓ | put-in-play / put-on / stays-in-play | — |
| Library Hunting Ground | ✓ | location (first line) | — |
| Life Boon | ✓ | put-in-play / put-on / stays-in-play | — |
| Life in the City | — |  | — |
| Lilith's Blessing | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Liquidation | — |  | — |
| London Evening Star, Tabloid Newspaper | ✓ | location (first line) | — |
| Loner | ✓ | put-in-play / put-on / stays-in-play | — |
| Lupine Assault | — |  | — |
| Maabara | ✓ | location (first line) | ✓ |
| Madness Network | ✓ | put-in-play / put-on / stays-in-play | — |
| Madness of the Bard | ✓ | put-in-play / put-on / stays-in-play | — |
| Major Boon | ✓ | put-in-play / put-on / stays-in-play | — |
| Maleficia | ✓ | put-in-play / put-on / stays-in-play | — |
| Malkavian Dementia | — |  | — |
| Malkavian Derangement: Alternate Personality | ✓ | put-in-play / put-on / stays-in-play | — |
| Malkavian Derangement: Paranoia | ✓ | put-in-play / put-on / stays-in-play | — |
| Malkavian Game | — |  | — |
| Malkavian Prank | — |  | — |
| Malkavian Time Auction | — |  | — |
| Mapatano Utando | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Market Square | ✓ | location (first line) | — |
| Masquerade Endangered | ✓ | put-in-play / put-on / stays-in-play | — |
| Mbare Market, Harare | ✓ | location (first line) | — |
| Meditative Grove | ✓ | location (first line) | ✓ |
| Memories of Mortality | ✓ | put-in-play / put-on / stays-in-play | — |
| Metro Underground | ✓ | location (first line) | ✓ |
| Millicent Smith, Puritan Vampire Hunter | ✓ | put-in-play / put-on / stays-in-play | — |
| Minion Tap | — |  | — |
| Minor Boon | ✓ | put-in-play / put-on / stays-in-play | — |
| Misdirection | — |  | — |
| Mistrust | — |  | — |
| Mithraic Cultist | ✓ | put-in-play / put-on / stays-in-play | — |
| Mob Connections | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Mobile HQ, Operation Antigen | ✓ | location (first line) | ✓ |
| Momentum's Edge | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Monastery of Shadows | ✓ | location (first line) | — |
| Monster | ✓ | put-in-play / put-on / stays-in-play | — |
| Morgue Hunting Ground | ✓ | location (first line) | — |
| Mundane | ✓ | put-in-play / put-on / stays-in-play | — |
| Necromancy | ✓ | put-in-play / put-on / stays-in-play | — |
| New Carthage | ✓ | location (first line) | — |
| New in Town | ✓ | put-in-play / put-on / stays-in-play | — |
| Nocturn Theater | ✓ | location (first line) | ✓ |
| Nod | — |  | — |
| Nosferatu Hosting | — |  | — |
| Nosferatu Kingdom | ✓ | location (first line) | — |
| Not to Be | ✓ | put-in-play / put-on / stays-in-play | — |
| Oath of Loyalty | ✓ | put-in-play / put-on / stays-in-play | — |
| Obfuscate | ✓ | put-in-play / put-on / stays-in-play | — |
| Oblivion | ✓ | put-in-play / put-on / stays-in-play | — |
| Obsession | ✓ | put-in-play / put-on / stays-in-play | — |
| Obtenebration | ✓ | put-in-play / put-on / stays-in-play | — |
| Opium Den | ✓ | location (first line) | — |
| Orun | ✓ | put-in-play / put-on / stays-in-play | — |
| Out of Control | — |  | — |
| Out of the Frying Pan | — |  | — |
| Oxford University, England | ✓ | location (first line) | ✓ |
| Palace Hunting Ground | ✓ | location (first line) | — |
| Palla Grande | ✓ | put-in-play / put-on / stays-in-play | — |
| Pallid | ✓ | put-in-play / put-on / stays-in-play | — |
| Papillon | ✓ | location (first line) | — |
| Paragon | ✓ | put-in-play / put-on / stays-in-play | — |
| Paris Opera House | ✓ | location (first line) | ✓ |
| Park Hunting Ground | ✓ | location (first line) | — |
| Path of Death and the Soul | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Path of Evil Revelations | ✓ | put-in-play / put-on / stays-in-play | — |
| Path of the Void | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Pentex™ Loves You! | ✓ | location (first line) | ✓ |
| Pentex™ Subversion | ✓ | put-in-play / put-on / stays-in-play | — |
| Père Lachaise, France | ✓ | location (first line) | — |
| Perfectionist | ✓ | put-in-play / put-on / stays-in-play | — |
| Personal Involvement | — |  | — |
| Piper | — |  | — |
| Playing for Keeps | ✓ | put-in-play / put-on / stays-in-play | — |
| Poacher's Hunting Ground | ✓ | location (first line) | — |
| Police Department | ✓ | location (first line) | — |
| Political Hunting Ground | ✓ | location (first line) | — |
| Political Seizure | ✓ | location (first line) | — |
| Port Hunting Ground | ✓ | location (first line) | — |
| Potence | ✓ | put-in-play / put-on / stays-in-play | — |
| Power Structure | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Powerbase: Barranquilla | ✓ | location (first line) | — |
| Powerbase: Berlin | ✓ | location (first line) | ✓ |
| Powerbase: Cape Verde | ✓ | location (first line) | — |
| Powerbase: Chicago | ✓ | location (first line) | — |
| Powerbase: Los Angeles | ✓ | location (first line) | ✓ |
| Powerbase: Luanda | ✓ | location (first line) | ✓ |
| Powerbase: Madrid | ✓ | location (first line) | ✓ |
| Powerbase: Mexico City | ✓ | location (first line) | — |
| Powerbase: Montreal | ✓ | location (first line) | — |
| Powerbase: Munich | ✓ | location (first line) | ✓ |
| Powerbase: New York | ✓ | location (first line) | — |
| Powerbase: Rome | ✓ | location (first line) | — |
| Powerbase: Savannah | ✓ | location (first line) | — |
| Powerbase: Tshwane | ✓ | location (first line) | ✓ |
| Powerbase: Washington, D.C. | ✓ | location (first line) | — |
| Powerbase: Zürich | ✓ | location (first line) | — |
| Presence | ✓ | put-in-play / put-on / stays-in-play | — |
| Priority Contract | ✓ | put-in-play / put-on / stays-in-play | — |
| Privileged Position | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Prophecies of Gehenna | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Protean | ✓ | put-in-play / put-on / stays-in-play | — |
| Protected Resources | ✓ | put-in-play / put-on / stays-in-play | — |
| Protracted Investment | ✓ | put-in-play / put-on / stays-in-play | — |
| Proxy Kissed | ✓ | put-in-play / put-on / stays-in-play | — |
| Purchase Pact | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Quietus | ✓ | put-in-play / put-on / stays-in-play | — |
| Ravager | ✓ | put-in-play / put-on / stays-in-play | — |
| Ravnos Cache | ✓ | location (first line) | ✓ |
| Ravnos Carnival | ✓ | location (first line) | — |
| Rebel | ✓ | put-in-play / put-on / stays-in-play | — |
| Recruitment | — |  | — |
| Redeem the Lost Soul | — |  | — |
| Redline | ✓ | put-in-play / put-on / stays-in-play | — |
| Regarhagan's Hold | ✓ | put-in-play / put-on / stays-in-play | — |
| Regenerative Blood | ✓ | put-in-play / put-on / stays-in-play | — |
| Regent | ✓ | put-in-play / put-on / stays-in-play | — |
| Remover | ✓ | put-in-play / put-on / stays-in-play | — |
| Research | — |  | — |
| Retribution | — |  | — |
| Rogue | — |  | — |
| Rötschreck | ✓ | put-in-play / put-on / stays-in-play | — |
| Ruins of Charizel | ✓ | location (first line) | — |
| Saulot's Avenging Fist | ✓ | put-in-play / put-on / stays-in-play | — |
| Saulot's Guiding Wisdom | ✓ | put-in-play / put-on / stays-in-play | — |
| Saulot's Healing Touch | ✓ | put-in-play / put-on / stays-in-play | — |
| Seattle Committee | ✓ | put-in-play / put-on / stays-in-play | — |
| Secret Horde | ✓ | put-in-play / put-on / stays-in-play | — |
| Secret Passage | ✓ | put-in-play / put-on / stays-in-play | — |
| Secure Haven | ✓ | location (first line) | — |
| Sense Vibrations | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Sermon of Caine | — |  | — |
| Serpentis | ✓ | put-in-play / put-on / stays-in-play | — |
| Servitor of Irad | ✓ | put-in-play / put-on / stays-in-play | — |
| Shakar | ✓ | put-in-play / put-on / stays-in-play | — |
| Shakar: the Hunt | ✓ | put-in-play / put-on / stays-in-play | — |
| Shanty Town Hunting Ground | ✓ | location (first line) | — |
| Shock Troops | — |  | — |
| Short-Term Investment | ✓ | put-in-play / put-on / stays-in-play | — |
| Sight Beyond Sight | ✓ | put-in-play / put-on / stays-in-play | — |
| Slave Auction | ✓ | put-in-play / put-on / stays-in-play | — |
| Slum Hunting Ground | ✓ | location (first line) | — |
| Smear Campaign | ✓ | put-in-play / put-on / stays-in-play | — |
| Smiling Jack, The Anarch | ✓ | put-in-play / put-on / stays-in-play | — |
| Social Ladder | ✓ | put-in-play / put-on / stays-in-play | — |
| Society Hunting Ground | ✓ | location (first line) | — |
| Society of Leopold | ✓ | put-in-play / put-on / stays-in-play | — |
| Sociopath | ✓ | put-in-play / put-on / stays-in-play | — |
| Special Report | — |  | — |
| Specialization | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Spirit Summoning Chamber | ✓ | location (first line) | ✓ |
| Spontaneous Power | ✓ | put-in-play / put-on / stays-in-play | — |
| Static Virtue | — |  | — |
| Steam Tunnels | ✓ | location (first line) | ✓ |
| Storage Annex | ✓ | location (first line) | — |
| Storm Sewers | ✓ | location (first line) | ✓ |
| Strained Vitae Supply | ✓ | put-in-play / put-on / stays-in-play | — |
| Striga | ✓ | put-in-play / put-on / stays-in-play | — |
| Subdued by the Blood | — |  | — |
| Succubus Club | ✓ | location (first line) | ✓ |
| Sudden Reversal | — |  | — |
| Sunset Strip, Hollywood | ✓ | location (first line) | — |
| Svadharma | — |  | — |
| Swiss Cut | ✓ | put-in-play / put-on / stays-in-play | — |
| Tabriz Assembly | ✓ | put-in-play / put-on / stays-in-play | — |
| Tajdid | — |  | — |
| Talons of the Dead | ✓ | put-in-play / put-on / stays-in-play | — |
| Temple Hunting Ground | ✓ | location (first line) | — |
| Temptation of Greater Power | — |  | — |
| Tend the Flock | — |  | — |
| Tension in the Ranks | ✓ | put-in-play / put-on / stays-in-play | — |
| Terrifying Visage | ✓ | put-in-play / put-on / stays-in-play | — |
| Thaumaturgy | ✓ | put-in-play / put-on / stays-in-play | — |
| The Admonitions | ✓ | put-in-play / put-on / stays-in-play | — |
| The Anarch Free Press | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| The Art of Love | — |  | — |
| The Art of Pain | ✓ | put-in-play / put-on / stays-in-play | — |
| The Barrens | ✓ | location (first line) | ✓ |
| The Black Throne | ✓ | location (first line) | ✓ |
| The British Museum, London | ✓ | location (first line) | — |
| The Church of Vindicated Faith | ✓ | location (first line) | ✓ |
| The Coven | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| The Crocodile Temple | ✓ | location (first line) | — |
| The Damned | ✓ | put-in-play / put-on / stays-in-play | — |
| The Diamond Thunderbolt | — |  | — |
| The Erciyes Fragments | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| The Eternals of Sirius | — |  | — |
| The Hungry Coyote | ✓ | location (first line) | — |
| The Hunt Club | ✓ | put-in-play / put-on / stays-in-play | — |
| The Khabar: Community | ✓ | put-in-play / put-on / stays-in-play | — |
| The Labyrinth | ✓ | location (first line) | ✓ |
| The Line | ✓ | location (first line) | ✓ |
| The Louvre, Paris | ✓ | location (first line) | ✓ |
| The Malkavian Seven Miseries | ✓ | put-in-play / put-on / stays-in-play | — |
| The Marrakesh Codex | ✓ | put-in-play / put-on / stays-in-play | — |
| The Mausoleum, Venice | ✓ | location (first line) | — |
| The Mithraeum, London | ✓ | location (first line) | — |
| The Parthenon | ✓ | location (first line) | ✓ |
| The Path of Blood | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Bone | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Harmony | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Lilith | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| The Path of Metamorphosis | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Night | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Paradox | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Retribution | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Service | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Tears | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of the Feral Heart | ✓ | put-in-play / put-on / stays-in-play | — |
| The Path of Typhon | ✓ | put-in-play / put-on / stays-in-play | — |
| The Rack | ✓ | location (first line) | — |
| The Realm of the Black Sun | ✓ | put-in-play / put-on / stays-in-play | — |
| The Rose Foundation | ✓ | location (first line) | ✓ |
| The Rumor Mill, Tabloid Newspaper | ✓ | location (first line) | ✓ |
| The Secret Library of Alexandria | ✓ | location (first line) | — |
| The Shard, London | ✓ | location (first line) | ✓ |
| The Slaughterhouse | ✓ | location (first line) | — |
| The Spawning Pool | ✓ | location (first line) | ✓ |
| The Stranger Among Us | — |  | — |
| The Treatment | ✓ | put-in-play / put-on / stays-in-play | — |
| Therbold Realty | ✓ | location (first line) | — |
| Thicker than Blood | — |  | — |
| Threestar Cab Company | ✓ | location (first line) | — |
| Tomb of Rameses III | ✓ | location (first line) | — |
| Toreador Grand Ball | ✓ | put-in-play / put-on / stays-in-play | — |
| Tower of London | ✓ | location (first line) | — |
| Toy Chest Test | — |  | — |
| Traditionalist | ✓ | put-in-play / put-on / stays-in-play | — |
| Tragic Love Affair | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Transcendent Laibon | ✓ | put-in-play / put-on / stays-in-play | — |
| Treaty of Laibach | ✓ | put-in-play / put-on / stays-in-play | — |
| Tremere Convocation | ✓ | put-in-play / put-on / stays-in-play | — |
| Tribute to the Master | — |  | — |
| Trophy: Chosen | — |  | — |
| Trophy: Clan Respect | — |  | — |
| Trophy: Diablerie | — |  | — |
| Trophy: Discipline | — |  | — |
| Trophy: Domain | — |  | — |
| Trophy: Hunting Ground | — |  | — |
| Trophy: Library | — |  | — |
| Trophy: No Questions | — |  | — |
| Trophy: Progeny | — |  | — |
| Trophy: Retainers | — |  | — |
| Trophy: Revered | — |  | — |
| Trophy: Safe Passage | — |  | — |
| Trophy: Wealth | — |  | — |
| True Faith | ✓ | put-in-play / put-on / stays-in-play | — |
| Twilight Camp | ✓ | put-in-play / put-on / stays-in-play | — |
| Twisted Forest | ✓ | location (first line) | — |
| Two Wrongs | — |  | — |
| Unacceptable Appearance | ✓ | put-in-play / put-on / stays-in-play | — |
| Underworld Hunting Ground | ✓ | location (first line) | — |
| Unholy Sacrament | — |  | — |
| Unity | — |  | ✓ |
| University Hunting Ground | ✓ | location (first line) | — |
| Unnatural Disaster | — |  | — |
| Uptown Hunting Ground | ✓ | location (first line) | — |
| Using the Advantage | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Vampiric Disease | — |  | — |
| Vast Wealth | ✓ | put-in-play / put-on / stays-in-play | — |
| Ventrue Directorate Assembly | ✓ | put-in-play / put-on / stays-in-play | — |
| Ventrue Headquarters | ✓ | location (first line) | ✓ |
| Ventrue Investment | ✓ | put-in-play / put-on / stays-in-play | — |
| Vessel | — |  | — |
| Vicissitude | ✓ | put-in-play / put-on / stays-in-play | — |
| Vicissitude Poisoning | ✓ | put-in-play / put-on / stays-in-play | — |
| Vigil: The Thin Line | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Villein | ✓ | put-in-play / put-on / stays-in-play | — |
| Virolax Facility | ✓ | location (first line) | — |
| Visit from the Capuchin | ✓ | put-in-play / put-on / stays-in-play | — |
| Vox Domini | — |  | — |
| Vox Senis | ✓ | put-in-play / put-on / stays-in-play | — |
| Vulnerability | — |  | — |
| Wall Street Night, Financial Newspaper | ✓ | location (first line) | ✓ |
| Warning Sirens | — |  | — |
| Warsaw Station | ✓ | location (first line) | ✓ |
| Warzone Hunting Ground | ✓ | location (first line) | — |
| Wash | — |  | — |
| Wasserschloss Anif, Austria | ✓ | location (first line) | — |
| Waste Management Operation | ✓ | location (first line) | — |
| Watchtower: Chosen are Called | ✓ | put-in-play / put-on / stays-in-play | — |
| Watchtower: Four Ride Forth | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Watchtower: The Wolves Feed | ✓ | put-in-play / put-on / stays-in-play | — |
| Week of Nightmares | ✓ | put-in-play / put-on / stays-in-play | — |
| Weeping Stone | ✓ | location (first line) | — |
| Whispers of the Nictuku | ✓ | put-in-play / put-on / stays-in-play | — |
| Wider View | ✓ | put-in-play / put-on / stays-in-play | — |
| WMRH Talk Radio | ✓ | location (first line) | ✓ |
| XTC-Laced Blood | ✓ | put-in-play / put-on / stays-in-play | — |
| Yawp Court | ✓ | location (first line) | ✓ |
| Yoruba Shrine | ✓ | location (first line) | ✓ |
| Zillah's Valley | — |  | — |
| Zoning Board | ✓ | put-in-play / put-on / stays-in-play | ✓ |
| Zoo Hunting Ground | ✓ | location (first line) | — |

## Alla 149 lock-taggade kort (alla korttyper), med matchad textsnutt

| Kort | Typ | Matchad text |
|---|---|---|
| Abandoning the Flesh | combat/react | You can lock this card during a bleed action to give an acting vampire with Dementation [dem] +1 bleed |
| Abjure | power | [COMBAT] Lock this imbued before range is determined to end a combat between a monster and a mortal |
| Agate Talisman | equip | The bearer can lock this card during the polling step of any referendum before votes and ballots are cast to get +1 vote |
| Al's Army Apparatus | master | During your minion phase, you may lock this card to search your library for a weapon and move it to your hand (shuffle and discard afterward) |
| Anarch Railroad | master | You can lock this card to give an Anarch +1 stealth |
| Arcane Library | master | You can lock this card during your influence phase to add 1 blood to a Tremere in your uncontrolled region |
| Art Museum | master | You can lock this location during your influence phase to add 1 blood to a Toreador in your uncontrolled region |
| Aye | master | This Laibon may lock this card to cancel a Frenzy card played on him or her as it is played |
| Babble | react | Lock this vampire to unlock another ready minion |
| Bait and Switch | react | Lock this reacting vampire |
| Bastille Opera House | master | You can lock this card during the polling step of a political action to get +1 vote for each ready Daughter of Cacophony you control |
| Blanket of Night | mod | Lock this modifying vampire to have that attempt fail; the blocking minion cannot attempt to block this action again |
| Bleeding the Vine | master | During your unlock phase, lock this card or burn 1 pool |
| Bloodstorm of Chorazin | react | Lock this Baali |
| Cappadocian Crypt | master | You can lock this location after resolution of a successful action requiring Hecata or Oblivion [obl] to add 1 blood to a Hecata you control |
| Car Bomb | react | Lock this reacting minion |
| Channel 10 | master | You can lock this card to give a minion you control +2 intercept |
| Chantry | master | You can lock this card and burn 1 pool or 1 blood from a ready Tremere you control during your master phase to move a Tremere from torpor to their controller's ready region |
| Church of the Order of St. Blaise | master | Lock this card to add one counter to a location you control that uses counters |
| Clotho's Gift | action | During your minion phase, this vampire can lock this card and burn 1 blood to unlock |
| Command | mod | (curated) |
| Command Performance | master | You can lock this card during your minion phase to unlock a ready Daughter of Cacophony |
| Communal Haven: Cathedral | master | You may lock this card during your master phase to transfer equipment and/or move blood between any two ready Sabbat vampires you control |
| Conniver | master | If your prey loses pool when it is neither your turn nor your prey's turn, you may lock this card to move 1 blood from the blood bank to this vampire |
| Corporal Reservoir | master | This vampire may lock this card to prevent 1 point of damage in combat or to gain a blood |
| Creepshow Casino | master | You can lock this card as a vampire you control announces an undirected action to give that vampire +1 stealth, even if stealth is not yet needed |
| Curmudgeon | master | If that minion is blocked this turn, you may lock this card to move 1 blood from the blood bank to this vampire |
| Deflection | react | [dom] Lock this reacting vampire |
| Determine | react | Lock this reacting imbued |
| Devil-Channel: Throat | mod | (curated) |
| Elder Michaelis's Hold | react | Lock this reacting vampire |
| Elixir of Distillation | equip | (curated) |
| Elysian Fields | master | You can lock this location to give a Lasombra you control +1 stealth |
| Elysium: Sforzesco Castle | master | When a vampire you control blocks a Camarilla vampire, you may lock this card instead of locking the blocking vampire |
| Elysium: The Arboretum | master | You may lock this card before range is determined to end combat |
| Elysium: The Palace of Versailles | master | You can lock this location during the polling step of a political action to give each titled Camarilla vampire you control +1 vote |
| Enkil Cog | mod | During any Methuselah's minion phase, this vampire can lock this card to take an action |
| Eyes of the Wild | react | Lock this Gangrel after action resolution if they did not block this action |
| Faerie Wards | react | Lock this reacting vampire |
| Fast Reaction | react | [aus] Lock this vampire |
| Feral Hound | retainer | You can lock this retainer to give the employer +1 intercept |
| Final Loosening | react | Lock this Anarch |
| Follow the Alpha | mod | Lock this Gangrel antitribu |
| Follow the Blood | react | Lock this Black Hand vampire |
| Forest of Shadows | master | You may lock this card to give a Malkavian you control +X stealth until the end of the turn, where X is the amount of blood the Malkavian burns |
| Fortune Teller Shop | master | You can lock this card to give a Ravnos +1 stealth |
| Foul Blood | react | Lock this reacting vampire |
| Fragment of the Book of Nod | master | You can lock this card to draw 2 cards (discard down afterward) |
| Free Fight | combat | [san] Lock this Blood Brother and any number of ready unlocked members you control of this circle |
| Garibaldi-Meucci Museum | master | You can lock this location and burn 1 pool during your unlock phase to exchange one card from your hand for one card in your ash heap requiring an Anarch |
| Gather | action | During the influence phase, you may lock this card to move that Gangrel from your uncontrolled region to your ready region, with any counters he or she has, unless that Gangrel would contest a vampire in play |
| Gift of Experience | master | (curated) |
| Glutton | master | You may lock this card to unlock a ready Ishtarri you control |
| Hedonism | mod | Lock this vampire and the blocking minion, and queue a combat between them |
| Hidden Lurker | mod | [obf] Lock this vampire |
| Insurance Scam | master | During your turn, you may lock this card and burn X locations you control to gain X pool |
| Irregular Protocol | react | Lock this reacting vampire to force the acting vampire to abstain (this can cancel that vampire's votes and ballots) |
| Joseph Pander | master | You can lock this card and burn 1 pool to have an action directed at a Pander you control fail |
| Kingston Penitentiary, Ontario | master | Any other Methuselah may give you a pool during his or her unlock phase to lock this card to move 1 blood from the blood bank to a ready vampire he or she controls |
| KRCG News Radio | master | You can lock this card to give a minion you control +1 intercept |
| Kumpania | master | You can lock this card to give a Ravnos with capacity 5 or more you control +1 intercept |
| Legacy of Power | react | Lock this reacting vampire and end combat |
| Lilith's Blessing | master | As a master phase action, you may lock this card to search your library for a master: Discipline card and choose a ready non-Bahari vampire you control who has no blood |
| Lost in Translation | react | Lock this reacting vampire |
| Maabara | master | You may lock this location to move a library card from your ash heap to this location, face down |
| Mapatano Utando | master | You may lock this card to reduce a bleed against you by 1 |
| Mask of a Thousand Faces | mod | Unlock the acting minion and lock this vampire instead |
| Meditative Grove | master | You can lock this card to cancel a frenzy card as it is played on a Salubri you control (cost is still paid) |
| Mental Maze | react | [obf] Lock this vampire and end the action |
| Metro Underground | master | During your discard phase, you may lock this card and burn 1 pool to unlock a vampire you control |
| Mob Connections | master | You can lock this card to give a minion you control 1 press, only usable to continue combat |
| Mobile HQ, Operation Antigen | master | An Operation Antigen ally you control can lock this location to attempt to enter combat with a vampire as a +1 stealth Ⓓ action |
| Momentum's Edge | master | You may lock this card during your unlock phase to gain 1 pool |
| Monstrous Form | action/combat | During combat, you can lock this card to give this vampire +1 strength this round, or 1 maneuver or press |
| Murmur of the False Will | mod/react | Lock this reacting vampire |
| My Enemy's Enemy | react | Lock this reacting vampire |
| Nightmares upon Nightmares | event | (curated) |
| Nocturn Theater | master | Lock this card and a ready vampire you control during your unlock phase to lock a minion controlled by your prey |
| Oxford University, England | master | You can lock this card and burn X pool during the polling step of a political action to get +2X votes |
| Paris Opera House | master | You can lock this card to give a Daughter of Cacophony you control +1 stealth |
| Path of Death and the Soul | master | When a minion controlled by another Methuselah is burned, you may lock this card to search your library (shuffle afterward), ash heap or hand for a Master: Discipline card |
| Path of the Void | master | During this vampire's unlock phase, his or her controller must discard a master card or lock this vampire |
| Peacemaker | react | [pre] Lock this blocking vampire |
| Pentex™ Loves You! | master | You may lock this card and choose a Sabbat vampire |
| Power of All | react | Lock this anarch and one other unlocked ready anarch you control to cancel a library card as it is played |
| Power Structure | master | During the polling step of a political action, you can lock this card to give each Lasombra you control +1 vote |
| Powerbase: Berlin | master | You may lock this card and burn X blood from it to give a Ventrue attempting to block a political action +X intercept |
| Powerbase: Los Angeles | master | During your discard phase, you can lock this location to get +1 discard phase action |
| Powerbase: Luanda | master | Lock this card during your master phase and choose a vampire you control |
| Powerbase: Madrid | master | You can lock this card during the polling step of any referendum to give a titled Sabbat vampire +1 vote for each counter on this card |
| Powerbase: Munich | master | During your master phase, you can lock this location to move 1 blood from a vampire with Oblivion [obl] you control to your pool or from your pool to a ready vampire with Oblivion [obl] you control |
| Powerbase: Tshwane | master | Lock this location to reduce the cost of a card you play by 1 pool (this location is not locked if that card is canceled as it is played) |
| Privileged Position | master | After a referendum called by a vampire you control passes, you can lock this card to burn 1 pool from your prey |
| Prophecies of Gehenna | master | During your master phase, you may lock this card to look at your prey's hand |
| Purchase Pact | master | When a Sabbat vampire you control is in combat with another Sabbat vampire, you may lock this card before range is determined to end combat |
| Ravnos Cache | master | Minions you control can lock this location to use those counters to pay some or all of the blood or pool cost of equipment they equip |
| Redirection | react | Lock this reacting vampire |
| Rutor's Hand | action | During your minion phase, this vampire can lock this card to unlock |
| Savannah Runner | react | [CEL] Lock this Laibon or an Aye on him or her to unlock another ready Laibon |
| SchreckNET | action | Whenever a referendum succeeds, you may lock this card to look at any Methuselah's hand |
| Sense Vibrations | master | This Laibon with Auspex may lock this card during a referendum to get 1 additional vote |
| Shattered Mirror | react | [dem] Put this card on the acting minion, lock this vampire, and end the action |
| Siren's Lure | mod | Lock this vampire and the blocking minion |
| Specialization | master | During your unlock phase, you may lock this card and discard two copies of the same card from your hand to gain 1 pool (draw afterward) |
| Spirit Summoning Chamber | master | Lock this card and burn 1 blood from a ready Tremere antitribu you control to search your library for a minion card that requires Blood Sorcery [tha] |
| Steam Tunnels | master | Lock this card during your master phase to look at the top three cards in your prey's library |
| Storm Sewers | master | You may lock this card as a minion you control announces an action |
| Succubus Club | master | During your unlock phase, you may lock this card to trade with a Methuselah who agrees to trade |
| Szlachta Bodyguard | retainer | The employer can lock this retainer to prevent 1 damage in combat |
| Tattoo Signal | action | This ready Seraph may lock this card to unlock another Black Hand vampire |
| Telepathic Misdirection | react | Lock this reacting vampire |
| The Anarch Free Press | master | You can lock this card to give an Anarch you control +1 intercept |
| The Barrens | master | You can lock this card to discard a card (draw up afterward) |
| The Black Throne | master | You can lock this card during the polling step of any referendum to get +2 votes |
| The Church of Vindicated Faith | master | When an imbued successfully performs an action, lock this card to move 1 blood from the blood bank to an imbued in your uncontrolled region |
| The Coven | master | You can lock this card to add 2 blood to a ready vampire you control |
| The Erciyes Fragments | master | Lock this card to move a library card from your prey's ash heap to this card, face down |
| The Labyrinth | master | You can lock this card to give a Nosferatu you control +1 stealth |
| The Line | master | You can lock this location to reduce the cost of an action card a vampire you control plays by 1 blood (this location is not locked if that card is canceled as it is played) |
| The Louvre, Paris | master | You can lock this location to lock a Toreador |
| The Mole | react | Lock this vampire to cause the action to fail |
| The Parthenon | master | During your master phase, you can lock this card to get +1 master phase action |
| The Path of Lilith | master | When a non-Camarilla vampire you control sends an opposing vampire to torpor in combat, you may lock this card to put a torture counter on the opposing vampire |
| The Rose Foundation | master | Lock this location and burn a conviction [1 CONVICTION] from a ready imbued you control to reduce a bleed against you by one or to gain two votes in a referendum |
| The Rumor Mill, Tabloid Newspaper | master | You can lock this card during an action to choose a vampire; the chosen vampire can burn 1 blood to get +1 intercept during that action |
| The Shard, London | master | If you have the Edge, you can lock this card to reduce the cost of a card you play by 2 pool or blood |
| The Spawning Pool | master | If a minion you control blocks a bleed against you, you may lock this card during the second round of the resulting combat to inflict 1 damage to the acting minion for each blood on the Spawning Pool |
| The Status Perfectus | action | When a blocking anarch has just completed combat with an acting minion, you may lock this card and a ready unlocked anarch you control other than the blocking anarch |
| Thin-Blooded Seer | action | During your unlock phase, you may lock this vampire to look at the top two cards of any Methuselah's library |
| Threading the Path of Orpheus | action | (curated) |
| Touch of Clarity | mod/react | Lock this vampire |
| Tragic Love Affair | master | (curated) |
| Under the Skin | mod | (curated) |
| Unity | master | Lock this card and burn 1 pool to move two cards that require an imbued (or a creed or a virtue) from your ash heap to the top of your library |
| Using the Advantage | master | During your unlock phase, if you control the Edge, you may lock this card to gain 1 pool |
| Ventrue Headquarters | master | You can lock this card during the polling step of any referendum to get +3 votes |
| Victim of Habit | action | During any Methuselah's unlock phase, you may lock this card to remove three copies of the chosen card in your prey's ash heap from the game to cause your prey to burn 1 pool |
| Vigil: The Thin Line | master | Lock this card to give a Defender +1 intercept when a monster is acting |
| Visions of Zapathasura | react | [OBF][PRE] Lock this vampire to reduce a bleed against you to 0 |
| Voice of Madness | react | [dem] Lock this vampire and end the action |
| Wall Street Night, Financial Newspaper | master | During an undirected action, you can lock this location to give a minion you control +1 intercept |
| Warsaw Station | master | You can lock this card as a Nosferatu announces an undirected action; after action resolution, if that action was successful, unlock the acting Nosferatu |
| Watchtower: Four Ride Forth | master | During your discard phase, you may lock this card to unlock any ready Black Hand vampire |
| Watchtower: Greatest Fall | political | Lock this card to move 1 blood from the blood bank to a Sabbat vampire in your ready region or your uncontrolled region (not usable during combat) |
| Winged Second | react | Lock this minion |
| WMRH Talk Radio | master | You can lock this card to give a minion +1 intercept |
| Yawp Court | master | If a political action is successful, before the referendum, you can lock this location and a ready unlocked Sabbat vampire you control to have that vampire enter combat with the acting vampire |
| Yoruba Shrine | master | If a ready Assamite you control is the target of a directed action or is chosen by the acting Methuselah in the terms of a referendum, you can lock this location to unlock the acting minion and have the action or referendum fail |
| Zoning Board | master | You may lock this card to gain 1 vote in that referendum |

## Persistent utanför Masters — typfördelning (776 kort totalt)

Equipment/Ally/Retainer/Event är redan väntat ~alltid persistenta per korttyp (Johans egen premiss) —
den här tabellen är bara för att bekräfta att inget oväntat läckte in, inte en granskningskö.

| Typ | Antal |
|---|---:|
| action | 239 |
| equip | 164 |
| ally | 119 |
| political | 78 |
| retainer | 54 |
| combat | 42 |
| event | 40 |
| mod | 31 |
| react | 25 |

