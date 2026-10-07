/* NZ Election 2026 — Compare the Parties
   Policy summaries + "explain simply" analogies are deliberately short,
   simplified comparisons — NOT official party positions. Always check
   each party's own manifesto before voting. */

/* Site-wide config. web3formsKey: get a free key instantly at
   https://web3forms.com (just enter an email, no password/signup) and
   paste it here — the suggestion form POSTs directly to their API with
   no server of our own needed. Leave blank to fall back to a mailto
   link using fallbackEmail instead. */
const SITE_CONFIG = {
  web3formsKey: "",
  fallbackEmail: "contact@novanexus.nz",
};

const PARTIES = [
  {
    id: "national",
    name: "National",
    short: "NAT",
    leader: "Christopher Luxon",
    role: "Prime Minister",
    color: "#5a8fb8",
    initials: "CL",
    logo: "assets/logos/national.png",
    blurb: "Centre-right. Tax relief, fiscal restraint, and getting NZ back on track economically.",
    policyUrl: "https://www.national.org.nz/plan",
  },
  {
    id: "labour",
    name: "Labour",
    short: "LAB",
    leader: "Chris Hipkins",
    role: "Leader of the Opposition",
    color: "#c1615a",
    initials: "CH",
    logo: "assets/logos/labour.png",
    blurb: "Centre-left. Public services, wages and workers rights, targeted cost-of-living support.",
    policyUrl: "https://www.labour.org.nz/our-policies/",
  },
  {
    id: "green",
    name: "Green Party",
    short: "GRN",
    leader: "Marama Davidson & Chöe Swarbrick",
    role: "Co-leaders",
    color: "#6b9e6e",
    initials: "MD",
    logo: "assets/logos/green.svg",
    blurb: "Progressive and environmental. Climate action, wealth tax, income guarantee.",
    policyUrl: "https://2026-nzgreens.nationbuilder.com/policy",
  },
  {
    id: "act",
    name: "ACT",
    short: "ACT",
    leader: "David Seymour",
    role: "ACT New Zealand",
    color: "#d1a13a",
    initials: "DS",
    logo: "assets/logos/act.svg",
    blurb: "Classical liberal. Smaller government, deregulation, personal responsibility.",
    policyUrl: "https://www.act.org.nz/policies",
  },
  {
    id: "nzfirst",
    name: "NZ First",
    short: "NZF",
    leader: "Winston Peters",
    role: "New Zealand First",
    color: "#4a5a68",
    initials: "WP",
    logo: "assets/logos/nzfirst.png",
    blurb: "Populist and nationalist. Sovereignty, tighter immigration, law and order.",
    policyUrl: "https://www.nzfirst.nz/news",
  },
  {
    id: "maori",
    name: "Te Pāti Māori",
    short: "TPM",
    leader: "Ngarewa-Packer & Waititi",
    role: "Co-leaders",
    color: "#9c3b40",
    initials: "TPM",
    logo: "assets/logos/maori.png",
    blurb: "Indigenous rights. Tino rangatiratanga, Treaty-led policy, rangatahi wellbeing.",
    policyUrl: "https://www.maoriparty.org.nz/policy",
  },
  {
    id: "top",
    name: "Opportunity (TOP)",
    short: "TOP",
    leader: "Qiulae Wong",
    role: "The Opportunity Party",
    color: "#3aa6a1",
    initials: "QW",
    logo: "assets/logos/top.svg",
    blurb: "Evidence-based and technocratic. Land value tax, Citizen's Income, 30GW renewables plan.",
    policyUrl: "https://www.opportunity.org.nz/policy",
  },
];

/* 18 policy domains. "desc" is the short sub-label shown under the name. */
const DOMAINS = [
  { id: "economy", name: "Economy & Tax", desc: "Tax, spending, trade." },
  { id: "housing", name: "Housing", desc: "Supply, rent, ownership." },
  { id: "health", name: "Health", desc: "Hospitals, GP access, prevention." },
  { id: "education", name: "Education", desc: "Schools, NCEA, tertiary." },
  { id: "immigration", name: "Immigration", desc: "Visas, residence, refugees." },
  { id: "security", name: "Security & Justice", desc: "Policing, sentencing, prisons." },
  { id: "climate", name: "Climate & Environment", desc: "Emissions, energy, Paris deal." },
  { id: "tiriti", name: "Te Tiriti & Māori Affairs", desc: "Treaty, co-governance." },
  { id: "welfare", name: "Welfare & Cost of Living", desc: "Benefits, daily costs." },
  { id: "foreign", name: "Foreign Affairs & Defence", desc: "Alliances, trade, sovereignty." },
  { id: "employment", name: "Employment & Wages", desc: "Jobs, wages, workplace rules." },
  { id: "transport", name: "Transport & Infrastructure", desc: "Roads, rail, buses." },
  { id: "energy", name: "Energy", desc: "Power generation, grid, prices." },
  { id: "drugs", name: "Drug & Alcohol Law", desc: "Prevention, cannabis, addiction." },
  { id: "agriculture", name: "Agriculture & Primary Industries", desc: "Farming, emissions, exports." },
  { id: "localgov", name: "Local Government & Rates", desc: "Councils, rates, water bills." },
  { id: "mentalhealth", name: "Mental Health & Addiction", desc: "Services, waitlists, prevention." },
  { id: "childpoverty", name: "Child Poverty & Family Support", desc: "Incomes, ECE, family hardship." },
];

/* POLICIES[partyId][domainId] = { p: policy summary, a: explain-it-simply analogy } */
const POLICIES = {
  national: {
    economy: { p: "Return to surplus, cut business regulation, free trade, restart oil & gas exploration.", a: "Like a household cutting spending and finding new part-time work to get back into savings." },
    housing: { p: "RMA reform, fast-track consenting, medium-density housing, infrastructure bonds.", a: "Like solving a squeeze by building more rooms, not capping what a room costs." },
    health: { p: "Cutting elective-surgery wait times, strengthening regional health hubs.", a: "Like adding checkout lanes at a busy supermarket so the queue moves faster." },
    education: { p: "Phonics-based literacy, restoring charter schools, limiting early-years screen time.", a: "Like switching back to a step-by-step recipe instead of guessing." },
    immigration: { p: "Points-based, prioritising skilled migrants, streamlined visa processing.", a: "Like a sports team recruiting for specific position gaps, not anyone who applies." },
    security: { p: "Reinstated Three Strikes, boot camps, more police, gang laws.", a: "Like a strict three-warnings rule — break it three times, no more leniency." },
    climate: { p: "ETS as main tool, reversing the oil & gas exploration ban.", a: "Like relying on one main tool — a carbon market — while easing rules." },
    tiriti: { p: "No standalone Te Tiriti policy; reviewed co-governance, says committed to principles.", a: "Like agreeing to honour an old agreement, while wanting to change how it's carried out." },
    welfare: { p: "Temporary $50/week tax-credit boost during the fuel price spike.", a: "Like a temporary top-up during a rough patch, budget otherwise kept tight." },
    foreign: { p: "Strong US/UK/Australia ties, Five Eyes, AUKUS observer status.", a: "Like staying close with your usual friend group while sitting in on a new one." },
    employment: { p: "Moving people from benefits into work; wage growth tied to productivity.", a: "Like preferring pay to rise with output, not a fixed government mandate." },
    transport: { p: "Fast-track consenting for roads/infrastructure, funded via bonds and PPPs.", a: "Like clearing the paperwork queue so new roads get built faster." },
    energy: { p: "Reversing the offshore oil & gas exploration ban to boost domestic supply.", a: "Like reopening a mine, betting the extra supply outweighs the trade-off." },
    drugs: { p: "Generally enforcement-focused, in line with its wider law-and-order platform.", a: "Like treating drug offences the tough way, same as other crimes." },
    agriculture: { p: "'Tools first, then price' on agricultural emissions; R&D into low-emission breeding and feeds; bottom line of no farm closures.", a: "Like giving farmers better gear before asking them to pay for pollution, promising no one loses their farm." },
    localgov: { p: "Proposes capping annual rates rises to 2–4%; water infrastructure costs handled separately under 'Local Water Done Well'.", a: "Like putting a speed limit on how fast your council bill can grow — but the water-pipes bill is separate." },
    mentalhealth: { p: "First government to set formal mental health and addiction targets; faster access, more frontline workers, better crisis response.", a: "Like setting a measurable goal — shorter wait times — and reporting progress against it." },
    childpoverty: { p: "No new targeted income-support payment; leans on economic growth and jobs as the route out of hardship.", a: "Like betting a stronger economy lifts families up, rather than a new direct payment." },
  },
  labour: {
    economy: { p: "28% tax on investment-property profit from July 2027, ring-fenced for health.", a: "Like asking anyone who sells a second house at a profit to chip in toward healthcare." },
    housing: { p: "Balances more supply with renter security; 2026 headline policy still developing.", a: "Like being both the builder adding rooms and the referee protecting tenants." },
    health: { p: "3 free GP visits/year, free prescriptions, free maternity scans via new Medicard.", a: "Like a free punch-card for doctor visits and medicine, so cost never stops you." },
    education: { p: "Would freeze the curriculum/NCEA overhaul, focus on student cost-of-living support.", a: "Like pausing a half-finished renovation to check the current build actually works." },
    immigration: { p: "Balances needed skills with stronger enforcement against worker exploitation.", a: "Like a landlord group checking new tenants aren't overcharged, while welcoming them." },
    security: { p: "Opposed reinstating Three Strikes and mandatory minimums.", a: "Like a teacher who prefers finding out why a student is acting out." },
    climate: { p: "Low-interest solar/battery finance, stays in the Paris Agreement.", a: "Like the government co-signing a loan so solar is affordable sooner." },
    tiriti: { p: "Restore Tiriti content in schools, restore iwi RMA agreements.", a: "Like putting the agreement back in the curriculum and giving whānau more say." },
    welfare: { p: "$20/week (main cities) or $10 elsewhere public transport fare cap.", a: "Like capping the weekly bus bill so a tight budget stretches further." },
    foreign: { p: "Independent foreign policy, UN and Pacific partnership engagement.", a: "Like settling disputes through the community committee, not one big neighbour." },
    employment: { p: "'Backing Māori into Skilled Work' training scheme; historically backs wage rises.", a: "Like running training pipelines to help more people into secure, well-paid trades." },
    transport: { p: "$20/$10 fare caps plus a 2026 Rapid Transit Initiative investment.", a: "Like capping the bus bill while investing in faster, more frequent services." },
    energy: { p: "Low-interest finance for household solar/batteries, subsidies for lower incomes.", a: "Like the government covering the upfront cost so more households go solar." },
    drugs: { p: "Among the stronger backers of evidence-based prevention on tobacco and alcohol.", a: "Like siding with public-health advice over industry lobbying on tighter rules." },
    agriculture: { p: "Stepped back from pricing agricultural emissions; backs regenerative farming and waterway restoration instead.", a: "Like choosing to help farmers change gradually rather than charging them for emissions first." },
    localgov: { p: "No detailed 2026 rates/water policy published; previously pursued pooling water infrastructure regionally in government.", a: "Not a headline topic for this party this campaign." },
    mentalhealth: { p: "Says cost and wait times are the main barriers; wants properly funded, culturally grounded teams with timely access regardless of ability to pay.", a: "Like making sure a full wallet isn't the only way to get seen quickly." },
    childpoverty: { p: "Set the original Child Poverty Reduction targets in law; 2026 platform leans on its health and transport cost-of-living policies.", a: "Like having already set the finish line in law, and now trying other ways to help families reach it." },
  },
  green: {
    economy: { p: "Wealth tax and bigger state role, funding decarbonisation and public housing.", a: "Like asking whoever has the biggest slice of cake to give a bit more." },
    housing: { p: "Mass public housing, rent-rise caps, no-cause eviction limits.", a: "Like the city building lots of affordable housing itself, not waiting on landlords." },
    health: { p: "Free dental and GP visits, 20hrs free childcare from 6 months.", a: "Like making the whole clinic free at the door, funded by higher earners." },
    education: { p: "Restore fee-free tertiary study, move toward debt-free education.", a: "Like removing the toll gate on the road to university." },
    immigration: { p: "Expanded humanitarian pathways for refugees and Pacific climate migrants.", a: "Like opening guest rooms for neighbours whose homes flooded, not just paying guests." },
    security: { p: "Strongly opposes Three Strikes, focus on preventing harm first.", a: "Like fixing a leaky roof before it floods the room." },
    climate: { p: "Rapid decarbonisation, free public transport, fast electrification.", a: "Like sprinting toward the emissions finish line instead of jogging." },
    tiriti: { p: "Te Tiriti a bedrock thread through its whole platform.", a: "Like treating the founding agreement as the foundation the house is built on." },
    welfare: { p: "Free public transport plus a weekly Family Top-Up payment.", a: "Like a weekly top-up cheque plus free rides, funded by higher earners." },
    foreign: { p: "Climate-focused diplomacy, Pacific partnerships, nuclear-free stance.", a: "Like being the friend who raises climate and fairness at every meet-up." },
    employment: { p: "Pushes fair pay agreements and a living wage.", a: "Like pushing for a wage that covers the weekly shop, not just the legal minimum." },
    transport: { p: "Strongest push for free/low-cost public transport and electrification.", a: "Like making the bus free at the door and going electric fast." },
    energy: { p: "Fastest grid electrification, opposes new fossil fuel projects outright.", a: "Like unplugging from fossil fuels as fast as possible, no new connections." },
    drugs: { p: "Strongest backer of prevention rules; has historically supported cannabis law reform.", a: "Like treating drugs mainly as a health issue to prevent harm from." },
    agriculture: { p: "Fair, science-based emissions pricing for agriculture; phasing out environmentally degrading practices, more urban/sustainable farming.", a: "Like asking farming to follow the same pollution rules as everyone else, based on the evidence." },
    localgov: { p: "Not a headline 2026 focus for this party.", a: "Not a headline topic for this party this election." },
    mentalhealth: { p: "Aims to eliminate therapy waiting lists by training and employing many more therapists and psychologists.", a: "Like hiring enough staff that the waitlist disappears instead of just being managed." },
    childpoverty: { p: "Pledges to end child poverty; ending public funding for private for-profit ECE centres by 2028, expanding community/non-profit ECE.", a: "Like redirecting childcare funding away from for-profit businesses and into community-run centres." },
  },
  act: {
    economy: { p: "Lower, flatter taxes, smaller state, less business regulation.", a: "Like trimming an overgrown hedge so it takes less space, leaving more yard for you." },
    housing: { p: "Supply-side reform and easier consenting to bring prices down via competition.", a: "Like cutting red tape so builders add houses faster, trusting supply to ease prices." },
    health: { p: "Efficiency and patient choice over large new free-service pledges.", a: "Like trusting people to pick their own plan, government stepping back." },
    education: { p: "School choice, opt-out of Student Services Fees, back-to-basics curriculum.", a: "Like a buffet where you only pay for dishes you actually want." },
    immigration: { p: "Market-driven, fewer barriers and faster visas for employer-sponsored migrants.", a: "Like cutting checkout paperwork so a shop can hire more staff faster." },
    security: { p: "Extend Three Strikes to burglary, no parole on a third offence.", a: "Like three-strikes extended to more fouls, no more chances on the third." },
    climate: { p: "Sceptical of strict Paris-style mandates, favours market pricing.", a: "Like letting market prices sort emissions, not government-set targets." },
    tiriti: { p: "Proposed the since-failed Treaty Principles Bill, favouring equal-citizenship framing.", a: "Like wanting one rulebook applying the same way to everyone." },
    welfare: { p: "Lower, flatter taxes leaving more in people's own pockets.", a: "Like handing people more of their paycheck up front, not a later subsidy." },
    foreign: { p: "Aligned with National on alliances, less government in trade deals.", a: "Like letting businesses pick trading partners directly, no extra middlemen." },
    employment: { p: "Lighter-touch wage-setting, more flexible employment arrangements.", a: "Like preferring employers and workers negotiate pay directly." },
    transport: { p: "User-pays roading via road-user charges over subsidised public transport.", a: "Like paying for the road you use, rather than everyone chipping in." },
    energy: { p: "Lets energy markets and prices, not mandates, drive the shift.", a: "Like trusting prices to nudge the country toward cleaner power naturally." },
    drugs: { p: "Personal-freedom framing points to lighter regulation of individual choices.", a: "Like preferring adults make their own calls, less government telling them what's healthy." },
    agriculture: { p: "Would repeal the Zero Carbon Act and permanently keep agriculture out of the ETS; cut red tape; introduce a rural visa.", a: "Like scrapping the climate paperwork for farmers entirely and making it easier to hire rural workers." },
    localgov: { p: "Backs a rates cap on council spending; favours smaller councils doing less, spending less.", a: "Like putting a strict budget leash on how much councils can charge you." },
    mentalhealth: { p: "No detailed 2026 mental health policy published; broader platform favours patient choice and private provision.", a: "Like preferring to let people pick their own provider rather than one government-run system." },
    childpoverty: { p: "Does not propose using tax changes to target poverty directly; favours growth and work incentives over targeted payments.", a: "Like betting that a bigger economy helps families more than a new welfare payment would." },
  },
  nzfirst: {
    economy: { p: "State ownership of banking/energy, protecting domestic industry from overseas buyers.", a: "Like a family keeping the business in-house rather than selling shares to outsiders." },
    housing: { p: "No major standalone 2026 housing policy published yet.", a: "Housing hasn't been a headline topic for this party this campaign." },
    health: { p: "Not a headline 2026 focus; backs current coalition health settings.", a: "Health hasn't been a headline topic for this party this campaign." },
    education: { p: "No detailed 2026 education announcements so far.", a: "Education is a smaller item on this party's to-do list this election." },
    immigration: { p: "Update birthright citizenship rules, widen deportation, reform asylum, lower migration.", a: "Like tightening a party guest list to only those needed for a job." },
    security: { p: "Strongly supports the coalition's sentencing reforms.", a: "Like fully backing the school's three-strikes policy, no exceptions." },
    climate: { p: "Sceptical of aggressive climate targets if they raise costs; wants a pragmatic approach.", a: "Like securing the country's own energy supply before outside commitments." },
    tiriti: { p: "Opposes 'separatism', backs a referendum on Māori electorates.", a: "Like arguing the house should run on one shared rulebook." },
    welfare: { p: "Opposes new housing taxes, frames relief as the priority.", a: "Like refusing new charges at checkout, keeping today's costs down." },
    foreign: { p: "Sovereignty-focused, wary of overseas ownership influencing NZ decisions.", a: "Like a family making its own decisions rather than following a bigger neighbour." },
    employment: { p: "Protecting local jobs and wages from being undercut by cheap overseas labour.", a: "Like making sure local staff aren't undercut by cheaper labour from abroad." },
    transport: { p: "No detailed 2026 transport policy published yet.", a: "Transport hasn't been a headline topic for this party this campaign." },
    energy: { p: "Backs state/domestic ownership of energy generators, prioritising security.", a: "Like wanting to own and control the power plants at home." },
    drugs: { p: "No detailed 2026 drug and alcohol policy published.", a: "Not a headline topic for this party this campaign." },
    agriculture: { p: "Strongly opposes pricing farm emissions or forced herd/fertiliser cuts; keeps agriculture out of climate rules entirely.", a: "Like telling farmers none of the new climate rules apply to them." },
    localgov: { p: "Backs a rates cap on council spending; prioritises ratepayer relief over new council spending.", a: "Like siding with ratepayers whenever councils want to spend or charge more." },
    mentalhealth: { p: "Backs community-led wellbeing initiatives, suicide-prevention programmes like Gumboot Friday, and new mental health response units.", a: "Like funding local, community-run support groups and dedicated crisis-response teams." },
    childpoverty: { p: "Tax-free $5,000-a-year 'Kiwi Kids Grant' for a citizen parent's first three children, for their first three years.", a: "Like a no-strings yearly top-up for new parents, as long as both parent and child are citizens." },
  },
  maori: {
    economy: { p: "Taxing wealth, revenue into housing, health, education and whānau support.", a: "Like asking the fullest wallet at the table to cover more of the bill." },
    housing: { p: "Safe, secure Māori housing and protection of whenua central to platform.", a: "Like making sure every family has a warm, secure home first." },
    health: { p: "Rebuild Māori-led health authority, prevention and whānau wellbeing focus.", a: "Like a clinic run by and for the community, treating the whole family." },
    education: { p: "Māori-led control over education services, though detail is less specific publicly.", a: "Like a marae running its own classroom, not one nationwide textbook." },
    immigration: { p: "Not a major published focus for 2026.", a: "Not a headline topic for this party this election." },
    security: { p: "Abolish prisons by 2040, community-led solutions instead.", a: "Like a restorative circle where the community helps fix the harm." },
    climate: { p: "Protection of whenua, wai and climate central to platform.", a: "Like treating land and water as family to protect." },
    tiriti: { p: "Binding Waitangi Tribunal recommendations, independent Te Tiriti Commission.", a: "Like checking every new house rule against the original agreement." },
    welfare: { p: "Wealthiest 'pay their fair share', revenue into housing and whānau support.", a: "Like asking the fullest wallet at the table to pick up more of the bill." },
    foreign: { p: "Not a major published focus; platform centres on domestic constitutional change.", a: "Not a headline topic for this party this election." },
    employment: { p: "'Fairness in wealth and resources' pillar extends to better-paid, secure work for whānau.", a: "Ties back to its bigger promise of a fairer economic slice for Māori." },
    transport: { p: "Not a headline focus of its published 2026 platform.", a: "Not a headline topic for this party this election." },
    energy: { p: "Folded into its broader whenua/wai/climate platform, not standalone yet.", a: "One thread in a bigger promise to protect land and water." },
    drugs: { p: "Among the strongest backers of tougher tobacco/alcohol prevention measures.", a: "Like treating addictive products as a health threat to whānau, not just willpower." },
    agriculture: { p: "$100m for regenerative Māori agriculture (Mātai Ahuwhenua), seed sovereignty, rejects gene editing, Māori-led food systems.", a: "Like funding whānau and hapū to grow kai their own way, without outside seed companies or GE crops." },
    localgov: { p: "Not a headline 2026 focus for this party.", a: "Not a headline topic for this party this election." },
    mentalhealth: { p: "Shift toward prevention and whānau wellbeing over crisis response; guarantees kaupapa Māori and gender-affirming mental health care in the public system.", a: "Like treating the whole whānau and culture as part of healing, not just the person in crisis." },
    childpoverty: { p: "$100m community food fund (home gardens, marae māra kai) and up to 8 weeks free food for low earners.", a: "Like funding community gardens and food banks so no child in a low-income whānau goes hungry." },
  },
  top: {
    economy: { p: "Land value tax (1.75% urban/0.5% rural) funds a flat income tax and Citizen's Income.", a: "Like taxing idle land itself, and mailing everyone a guaranteed weekly allowance instead." },
    housing: { p: "Land value tax aimed at discouraging speculation and lowering costs over time.", a: "Like taxing land held idle for speculation, so sitting on it costs more." },
    health: { p: "Flagged as a funding priority; full policy still being released alongside its other chapters.", a: "Still finishing this policy 'chapter' — some sections done, others in progress." },
    education: { p: "Proposes a 10-year cross-party education plan for stability and teacher support.", a: "Like agreeing a 10-year house renovation plan so it isn't ripped up each term." },
    immigration: { p: "Less developed publicly than its tax and energy platforms so far.", a: "Not yet one of TOP's fully 'finished' policy chapters." },
    security: { p: "Not among its released 'finished' policy chapters yet.", a: "Not yet one of TOP's fully 'finished' policy chapters." },
    climate: { p: "'Abundant Energy' plan: 30GW new renewables by 2050; 'Healthy Oceans' policy also released.", a: "Like planning to triple clean power by 2050, with the ocean its own chapter." },
    tiriti: { p: "Positions closer to Labour/Greens on Treaty issues; two Māori candidates in its top 10.", a: "Leans toward the 'strengthen the partnership' side of the debate." },
    welfare: { p: "Citizen's Income up to $370/week, replacing Jobseeker, Student Allowance and similar.", a: "Like one guaranteed weekly deposit for everyone instead of a maze of forms." },
    foreign: { p: "Not among its four released 'finished' policy chapters yet.", a: "Not yet one of TOP's fully 'finished' policy chapters." },
    employment: { p: "Citizen's Income designed partly to remove penalties for taking on extra work.", a: "Like removing the 'penalty' the current benefit system creates for extra shifts." },
    transport: { p: "Earlier platform backed a free youth transport pass; 2026 detail still developing.", a: "A free bus pass for young people, from an earlier platform being updated." },
    energy: { p: "'Abundant Energy': cross-party deal for 30GW renewables by 2050, household electrification loans.", a: "Like all parties agreeing one long-term power plan, then helping homes switch over." },
    drugs: { p: "Not among its released 'finished' policy chapters so far.", a: "Not yet one of TOP's fully 'finished' policy chapters." },
    agriculture: { p: "Land value tax (1.75% urban/0.5% rural) applies to farmland too; farming groups warn of cost risks.", a: "Like including farmland in the same land-tax rules as city land, which some farmers worry could hit them hard." },
    localgov: { p: "Not a headline 2026 focus for this party.", a: "Not a headline topic for this party this election." },
    mentalhealth: { p: "Broadly supportive of the Mental Health Foundation's proposed reforms in its 2026 response.", a: "Backs the expert-recommended fixes rather than proposing its own separate plan." },
    childpoverty: { p: "Not among its released 'finished' policy chapters yet.", a: "Not yet one of TOP's fully 'finished' policy chapters." },
  },
};

/* "Also on the ballot" — verified against the Electoral Commission's official
   Register of Political Parties and Logos, as at 5 August 2026. 17 parties
   total are registered; these are the 10 beyond the 7 compared above. */
const OTHER_PARTIES = [
  { name: "Alliance Party of Aotearoa New Zealand", pitch: "Newly registered Aug 2026. Democratic-socialist platform: public ownership, workers' rights, affordable housing, genuine Treaty partnership." },
  { name: "Animal Justice Party Aotearoa New Zealand", pitch: "Stronger animal welfare law, environmental protection, and a more compassionate Aotearoa." },
  { name: "Aotearoa Legalise Cannabis Party", pitch: "30 years campaigning to legalise cannabis in New Zealand." },
  { name: "Conservative Party NZ", pitch: "Socially conservative platform; renamed from “New Conservatives” back to Conservative Party NZ in January 2026." },
  { name: "Free Palestine", pitch: "Newly registered Aug 2026, campaigning on Palestinian solidarity and related foreign-policy positions." },
  { name: "New Zealand Loyal", pitch: "Newly re-registered Aug 2026. Anti-establishment, sovereignty-focused platform." },
  { name: "NZ Outdoors & Freedom Party", pitch: "Roots in protecting NZ's outdoor heritage; also campaigns on personal-freedom issues." },
  { name: "Te Tai Tokerau Party", pitch: "Newly registered Aug 2026, named for the Te Tai Tokerau (Northland) electorate — full platform not yet widely published." },
  { name: "Vision New Zealand", pitch: "Faith-based conservative party led by Hannah Tamaki." },
  { name: "Women's Rights Party", pitch: "Single-issue focus on sex-based rights and protections." },
];

/* "Campaign moments, decoded" — real statements and flashpoints from
   the campaign, explained in plain English. We verified directly that
   X's own embed API (publish.x.com/oembed) still works and is free —
   the actual blocker is that X no longer allows unauthenticated
   search/browsing at all, so there's no way to *discover* which tweets
   exist without a paid API or a logged-in session. Rather than dress
   up press-conference and interview quotes as fake tweet screenshots,
   each entry below is labelled with what it actually is (sourceType)
   and links to the original coverage. Hand-curated, periodically
   refreshed — update this array as new moments come up. */
const CAMPAIGN_MOMENTS = [
  {
    who: "Carlos Cheung",
    role: "National candidate, Mt Roskill",
    sourceType: "Social media post",
    quote: "Our democracy is not a target — there is no place for this dangerous behaviour.",
    context: "Posted after his campaign election hoarding (sign) was deliberately set on fire.",
    explain: "Someone set fire to his campaign sign, which is actually dangerous (fire can spread) as well as illegal. He's saying: however strongly you disagree with a candidate, burning their stuff crosses a line — disagree by voting, not vandalism.",
    link: "https://www.stuff.co.nz/nz-news/361042185/election-2026-catches-fire-candidate-says-vandalism-dangerous-completely-unacceptable",
  },
  {
    who: "Chlöe Swarbrick",
    role: "Green Party co-leader",
    sourceType: "Press statement",
    quote: "The National Party is trying to hide behind AI slop and take New Zealanders for idiots.",
    context: "Responding to a National Party attack ad about the Greens' wealth tax that used AI-generated content; National stood by the ad and didn't take it down.",
    explain: "This is a classic 'attack ad' fight: one party makes a punchy video about a rival's policy, the rival says 'that's not actually what we're proposing, and you didn't even pay a real person to make it.' When you see a scary clip about another party's policy online, it's worth checking that party's own website before believing it.",
    link: "https://www.rnz.co.nz/news/politics/650807/ai-slop-greens-criticise-national-attack-ad",
  },
  {
    who: "Seymour & Peters",
    role: "ACT leader & NZ First leader",
    sourceType: "News coverage",
    quote: "Seymour and Peters hit back as Luxon moves on under-16s social media ban.",
    context: "National campaigned on banning social media for under-16s; coalition partners ACT and NZ First publicly pushed back on the detail.",
    explain: "Even parties that work together in government don't always agree on everything. National wants a hard age limit (like how you can't buy alcohol under 18); ACT and NZ First have pushed back on the idea, favouring rules of their own instead. It's a preview of what they'd each push for if they win seats together again.",
    link: "https://www.1news.co.nz/2026/08/24/seymour-and-peters-hit-back-as-luxon-moves-on-under-16s-social-media-ban/",
  },
  {
    who: "Luxon & Hipkins",
    role: "National leader & Labour leader",
    sourceType: "TV debate",
    quote: "Neither had opened a convincing lead over the other, with most polls showing Labour and National effectively deadlocked.",
    context: "The first head-to-head TV debate aired 6 October 2026 on TVNZ, moderated by Jack Tame.",
    explain: "Think of this like a job interview watched by the whole country: the two people most likely to be Prime Minister stand on stage and take questions live, with no script. Because the polls have National and Labour almost tied, this debate matters more than usual — a strong or weak performance can actually shift votes.",
    link: "https://www.1news.co.nz/2026/10/06/leaders-debate-luxon-hipkins-square-off-a-month-out-from-election/",
  },
];

/* "I am a..." profiles for the Find Your Match page. `suggested` lists
   domain ids (from DOMAINS above) pre-highlighted as likely relevant —
   it's a starting point, not a restriction; every profile can still
   pick any concern. */
/* Real leader photos for the leaders strip. Separate from PARTIES
   because co-leader parties (Green, Te Pati Maori) get one chip each.
   Photo files live in assets/leaders/<photo>.jpg — all from Wikimedia
   Commons under free licences (credited in the footer). */
const LEADER_PROFILES = [
  { name: "Christopher Luxon", role: "Prime Minister", partyId: "national", photo: "luxon" },
  { name: "Chris Hipkins", role: "Leader of the Opposition", partyId: "labour", photo: "hipkins" },
  { name: "Marama Davidson", role: "Green co-leader", partyId: "green", photo: "davidson" },
  { name: "Chöe Swarbrick", role: "Green co-leader", partyId: "green", photo: "swarbrick" },
  { name: "David Seymour", role: "ACT Leader", partyId: "act", photo: "seymour" },
  { name: "Winston Peters", role: "NZ First Leader", partyId: "nzfirst", photo: "peters" },
  { name: "Debbie Ngarewa-Packer", role: "Te Pāti Māori co-leader", partyId: "maori", photo: "ngarewa-packer" },
  { name: "Rawiri Waititi", role: "Te Pāti Māori co-leader", partyId: "maori", photo: "waititi" },
  { name: "Qiulae Wong", role: "TOP Leader", partyId: "top", photo: "wong" },
];

const PROFILES = [
  { id: "student", label: "Student", icon: "🎓", suggested: ["education", "welfare", "employment"] },
  { id: "renter", label: "Renter", icon: "🏠", suggested: ["housing", "welfare", "employment"] },
  { id: "homeowner", label: "Homeowner", icon: "🏡", suggested: ["housing", "economy", "climate"] },
  { id: "immigrant", label: "Immigrant / Visa holder", icon: "🌏", suggested: ["immigration", "employment", "housing"] },
  { id: "business", label: "Business owner", icon: "💼", suggested: ["economy", "employment", "energy"] },
  { id: "parent", label: "Parent", icon: "👨‍👩‍👧", suggested: ["education", "health", "welfare"] },
  { id: "retiree", label: "Retiree", icon: "👵", suggested: ["welfare", "health", "economy"] },
  { id: "farmer", label: "Farmer / Rural", icon: "🚜", suggested: ["economy", "climate", "energy"] },
  { id: "jobseeker", label: "Jobseeker", icon: "🔍", suggested: ["welfare", "employment", "economy"] },
  { id: "other", label: "Just curious", icon: "🧭", suggested: [] },
];

/* Developing movements / news ticker fallback — used only if the live
   data/news.json fetch fails (see js/app.js). */
const NEWS_ITEMS = [
  { date: "12 Aug 2026", text: "PM Christopher Luxon survived a second National Party leadership vote, keeping the current coalition leadership intact heading into the campaign." },
  { date: "Aug-Sep 2026", text: "The Opportunity Party polling crept toward the 5% threshold for the first time, putting a possible 7th party in Parliament in play." },
  { date: "4-11 Sep 2026", text: "The Post/Freshwater Strategy poll had Labour on 28% narrowly ahead of National on 27%, with the Greens on 14% - the race remains tight." },
  { date: "16 Sep 2026", text: "A Health Coalition Aotearoa survey found Greens, Te Pati Maori and Labour giving the strongest backing to tougher tobacco and alcohol prevention rules." },
];
