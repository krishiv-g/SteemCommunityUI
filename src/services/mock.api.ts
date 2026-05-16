import type { ApiService, Post, Comment, User, Tag, Notification, WalletTransaction, Community, ForumThread, ForumReply, Poll } from './api.interface';

const delay = (ms?: number) => new Promise(r => setTimeout(r, ms ?? (300 + Math.random() * 500)));

const contributors: User[] = [
  {
    id: 'u1', username: 'greenleaf', displayName: 'Green Leaf',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=greenleaf',
    bio: 'Cannabis cultivator & writer. Sharing knowledge about sustainable growing.',
    followers: 842, following: 156, postCount: 47, joinedDate: '2022-03-15',
    reputation: 72, steemPower: 5200, steemBalance: 1250, sbdBalance: 340,
    balance: '1250.000 STEEM',
    savingsBalance: '500.000 STEEM',
    sbdBalanceStr: '340.000 SBD',
    savingsSbdBalance: '100.000 SBD',
    vestingShares: '5200.000000 VESTS',
    delegatedVestingShares: '200.000000 VESTS',
    receivedVestingShares: '300.000000 VESTS',
    rewardVestingBalance: '10.500000 VESTS',
    rewardVestingSteem: '0.065 STEEM',
    vestingBalance: '0.000 STEEM',
  },
  {
    id: 'u2', username: 'hempqueen', displayName: 'Hemp Queen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hempqueen',
    bio: 'Advocate for hemp industry. Exploring the intersection of cannabis & wellness.',
    followers: 1203, following: 89, postCount: 63, joinedDate: '2021-11-02',
    reputation: 68, steemPower: 8400, steemBalance: 2100, sbdBalance: 580,
    balance: '2100.000 STEEM',
    savingsBalance: '800.000 STEEM',
    sbdBalanceStr: '580.000 SBD',
    savingsSbdBalance: '250.000 SBD',
    vestingShares: '8400.000000 VESTS',
    delegatedVestingShares: '400.000000 VESTS',
    receivedVestingShares: '500.000000 VESTS',
    rewardVestingBalance: '15.250000 VESTS',
    rewardVestingSteem: '0.093 STEEM',
    vestingBalance: '0.000 STEEM',
  },
  {
    id: 'u3', username: 'budtender', displayName: 'The Budtender',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=budtender',
    bio: 'Professional budtender sharing strain reviews and cannabis culture.',
    followers: 567, following: 234, postCount: 31, joinedDate: '2023-01-20',
    reputation: 58, steemPower: 2300, steemBalance: 890, sbdBalance: 120,
    balance: '890.000 STEEM',
    savingsBalance: '300.000 STEEM',
    sbdBalanceStr: '120.000 SBD',
    savingsSbdBalance: '50.000 SBD',
    vestingShares: '2300.000000 VESTS',
    delegatedVestingShares: '100.000000 VESTS',
    receivedVestingShares: '150.000000 VESTS',
    rewardVestingBalance: '5.750000 VESTS',
    rewardVestingSteem: '0.035 STEEM',
    vestingBalance: '0.000 STEEM',
  },
  {
    id: 'u4', username: 'cannabismd', displayName: 'Dr. Cannabis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cannabismd',
    bio: 'Medical cannabis researcher. Evidence-based insights on therapeutic applications.',
    followers: 2150, following: 45, postCount: 89, joinedDate: '2021-06-10',
    reputation: 78, steemPower: 12000, steemBalance: 4500, sbdBalance: 1200,
    balance: '4500.000 STEEM',
    savingsBalance: '1500.000 STEEM',
    sbdBalanceStr: '1200.000 SBD',
    savingsSbdBalance: '600.000 SBD',
    vestingShares: '12000.000000 VESTS',
    delegatedVestingShares: '500.000000 VESTS',
    receivedVestingShares: '800.000000 VESTS',
    rewardVestingBalance: '22.000000 VESTS',
    rewardVestingSteem: '0.135 STEEM',
    vestingBalance: '0.000 STEEM',
  },
];

const contentCreators: User[] = [
  {
    id: 'u5', username: 'sativascribe', displayName: 'Sativa Scribe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sativascribe',
    bio: 'Longform cannabis journalist covering policy, culture, and emerging markets.',
    followers: 1840, following: 112, postCount: 104, joinedDate: '2021-02-18',
    reputation: 81, steemPower: 14200, steemBalance: 5800, sbdBalance: 1450,
    balance: '5800.000 STEEM',
    savingsBalance: '2000.000 STEEM',
    sbdBalanceStr: '1450.000 SBD',
    savingsSbdBalance: '750.000 SBD',
    vestingShares: '14200.000000 VESTS',
    delegatedVestingShares: '600.000000 VESTS',
    receivedVestingShares: '900.000000 VESTS',
    rewardVestingBalance: '25.500000 VESTS',
    rewardVestingSteem: '0.156 STEEM',
    vestingBalance: '0.000 STEEM',
  },
  {
    id: 'u6', username: 'terpenetalks', displayName: 'Terpene Talks',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=terpenetalks',
    bio: 'Terpene educator & aromatherapist. Making cannabis science accessible.',
    followers: 975, following: 67, postCount: 72, joinedDate: '2022-08-05',
    reputation: 74, steemPower: 9600, steemBalance: 3200, sbdBalance: 870,
    balance: '3200.000 STEEM',
    savingsBalance: '1200.000 STEEM',
    sbdBalanceStr: '870.000 SBD',
    savingsSbdBalance: '400.000 SBD',
    vestingShares: '9600.000000 VESTS',
    delegatedVestingShares: '450.000000 VESTS',
    receivedVestingShares: '650.000000 VESTS',
    rewardVestingBalance: '18.750000 VESTS',
    rewardVestingSteem: '0.115 STEEM',
    vestingBalance: '0.000 STEEM',
  },
  {
    id: 'u7', username: 'edibleartist', displayName: 'The Edible Artist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=edibleartist',
    bio: 'Cannabis chef & edibles creator. Recipes, dosing guides, and infusion techniques.',
    followers: 2390, following: 198, postCount: 58, joinedDate: '2022-01-12',
    reputation: 76, steemPower: 10800, steemBalance: 4100, sbdBalance: 990,
    balance: '4100.000 STEEM',
    savingsBalance: '1600.000 STEEM',
    sbdBalanceStr: '990.000 SBD',
    savingsSbdBalance: '500.000 SBD',
    vestingShares: '10800.000000 VESTS',
    delegatedVestingShares: '500.000000 VESTS',
    receivedVestingShares: '750.000000 VESTS',
    rewardVestingBalance: '20.250000 VESTS',
    rewardVestingSteem: '0.124 STEEM',
    vestingBalance: '0.000 STEEM',
  },
  {
    id: 'u8', username: 'indica_ink', displayName: 'Indica Ink',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=indicaink',
    bio: 'Cannabis illustrator & storyteller. Visual narratives from the plant world.',
    followers: 1560, following: 83, postCount: 41, joinedDate: '2023-03-22',
    reputation: 69, steemPower: 7100, steemBalance: 2800, sbdBalance: 620,
    balance: '2800.000 STEEM',
    savingsBalance: '1000.000 STEEM',
    sbdBalanceStr: '620.000 SBD',
    savingsSbdBalance: '300.000 SBD',
    vestingShares: '7100.000000 VESTS',
    delegatedVestingShares: '350.000000 VESTS',
    receivedVestingShares: '500.000000 VESTS',
    rewardVestingBalance: '14.000000 VESTS',
    rewardVestingSteem: '0.086 STEEM',
    vestingBalance: '0.000 STEEM',
  },
];

const users: User[] = [...contributors, ...contentCreators];

const posts: Post[] = [
  {
    id: 'p1', title: 'The Complete Guide to Organic Cannabis Cultivation',
    body: `<p>Growing cannabis organically is both an art and a science. In this comprehensive guide, we'll explore everything from soil preparation to harvest techniques that honor the plant's natural cycle.</p>
<h2>Why Go Organic?</h2>
<p>Organic cultivation produces cleaner, more flavorful buds while being better for the environment. By working with nature rather than against it, we create a sustainable growing ecosystem.</p>
<h2>Soil Preparation</h2>
<p>Start with a living soil mix that includes compost, worm castings, perlite, and beneficial microorganisms. The key is creating a diverse soil food web that feeds your plants naturally.</p>
<p>Consider adding amendments like bat guano for nitrogen, bone meal for phosphorus, and kelp meal for potassium. These organic inputs break down slowly, providing steady nutrition throughout the grow cycle.</p>
<h2>Water & Nutrients</h2>
<p>In organic growing, you're feeding the soil, not the plant. Use compost teas and fermented plant extracts to boost microbial activity. Maintain a pH between 6.0 and 7.0 for optimal nutrient uptake.</p>`,
    excerpt: 'Growing cannabis organically is both an art and a science. Discover the fundamentals of sustainable cultivation...',
    coverImage: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80',
    author: users[0], tags: ['cultivation', 'organic', 'growing', 'hempire'],
    createdAt: '2024-12-15T10:30:00Z', readingTime: 8, votes: 234, userVote: 0,
    commentCount: 18, bookmarked: false, payout: 12.45,
  },
  {
    id: 'p2', title: 'CBD vs THC: Understanding the Therapeutic Differences',
    body: `<p>The cannabis plant contains over 100 cannabinoids, but CBD and THC remain the most studied and widely used. Understanding their differences is crucial for anyone exploring cannabis therapeutics.</p>
<h2>The Endocannabinoid System</h2>
<p>Both CBD and THC interact with the endocannabinoid system (ECS), but in fundamentally different ways. THC binds directly to CB1 receptors, producing psychoactive effects, while CBD modulates these receptors indirectly.</p>
<h2>Medical Applications</h2>
<p>THC has shown efficacy for pain relief, nausea reduction, and appetite stimulation. CBD, meanwhile, has demonstrated anti-inflammatory, anti-anxiety, and neuroprotective properties without intoxication.</p>`,
    excerpt: 'Understanding the key differences between CBD and THC and their therapeutic applications...',
    coverImage: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
    author: users[3], tags: ['medical', 'cbd', 'thc', 'wellness', 'hempire'],
    createdAt: '2024-12-14T14:00:00Z', readingTime: 6, votes: 456, userVote: 1,
    commentCount: 32, bookmarked: true, payout: 28.90,
  },
  {
    id: 'p3', title: 'Top 10 Strains of 2024: A Budtender\'s Picks',
    body: `<p>After sampling hundreds of strains this year, here are my personal top 10 picks that stood out for flavor, potency, and overall experience.</p>
<h2>1. Jealousy</h2>
<p>This Seed Junky creation crosses Sherbert Bx1 with Gelato 41, delivering a creamy, fuel-forward flavor profile with a balanced hybrid high.</p>
<h2>2. Black Cherry Gelato</h2>
<p>A stunning cross with deep purple hues and cherry-forward terpenes. The effects are relaxing without being sedating.</p>`,
    excerpt: 'After sampling hundreds of strains this year, here are my personal top 10 picks...',
    coverImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800&q=80',
    author: users[2], tags: ['strains', 'reviews', 'hempire'],
    createdAt: '2024-12-13T09:00:00Z', readingTime: 12, votes: 189, userVote: 0,
    commentCount: 45, bookmarked: false, payout: 8.75,
  },
  {
    id: 'p4', title: 'The Rise of Hemp Fashion: Sustainable Style',
    body: `<p>Hemp fabric is making a comeback in the fashion industry, offering a sustainable alternative to cotton and synthetic materials.</p>
<h2>Environmental Benefits</h2>
<p>Hemp requires 50% less water than cotton and needs no pesticides. It naturally enriches the soil it grows in and produces more fiber per acre than any other crop.</p>`,
    excerpt: 'Hemp fabric is making a comeback in fashion, offering sustainability without sacrificing style...',
    coverImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
    author: users[1], tags: ['hemp', 'fashion', 'sustainability', 'hempire'],
    createdAt: '2024-12-12T16:00:00Z', readingTime: 5, votes: 312, userVote: 0,
    commentCount: 22, bookmarked: false, payout: 15.30,
  },
  {
    id: 'p5', title: 'Cannabis Terpenes: The Hidden Flavor Architects',
    body: `<p>While cannabinoids get the spotlight, terpenes are the unsung heroes that shape each strain's unique character.</p>
<h2>What Are Terpenes?</h2>
<p>Terpenes are aromatic compounds found in many plants, including cannabis. They're responsible for the distinctive smells and flavors of different strains.</p>`,
    excerpt: 'Discover how terpenes shape the cannabis experience beyond just THC and CBD...',
    coverImage: 'https://images.unsplash.com/photo-1457530378978-8bac673b8062?w=800&q=80',
    author: users[0], tags: ['terpenes', 'science', 'education', 'hempire'],
    createdAt: '2024-12-11T11:30:00Z', readingTime: 7, votes: 278, userVote: 0,
    commentCount: 15, bookmarked: true, payout: 11.20,
  },
  {
    id: 'p6', title: 'Building Community Through Cannabis Culture',
    body: `<p>Cannabis has always been about community. From the early days of counterculture to today's legal markets, the plant brings people together.</p>`,
    excerpt: 'How cannabis culture fosters genuine human connection and community building...',
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    author: users[1], tags: ['community', 'culture', 'hempire'],
    createdAt: '2024-12-10T08:00:00Z', readingTime: 4, votes: 145, userVote: 0,
    commentCount: 28, bookmarked: false, payout: 6.80,
  },
];

const comments: Record<string, Comment[]> = {
  p1: [
    {
      id: 'c1', postId: 'p1', author: users[1], body: 'This is exactly the guide I needed! The section on soil preparation is incredibly detailed.', createdAt: '2024-12-15T12:00:00Z', votes: 12, userVote: 0, payout: 0.85,
      replies: [
        { id: 'c1r1', postId: 'p1', author: users[0], body: 'Thank you! Soil health is really the foundation of everything.', createdAt: '2024-12-15T13:00:00Z', votes: 5, userVote: 0, replies: [], payout: 0.32 },
      ],
    },
    { id: 'c2', postId: 'p1', author: users[2], body: 'Great tips on compost tea. I\'ve been using a similar recipe with excellent results.', createdAt: '2024-12-15T14:30:00Z', votes: 8, userVote: 0, replies: [], payout: 0.54 },
  ],
  p2: [
    { id: 'c3', postId: 'p2', author: users[0], body: 'Really helpful breakdown of the endocannabinoid system. More people need to understand this.', createdAt: '2024-12-14T16:00:00Z', votes: 20, userVote: 0, replies: [], payout: 1.45 },
  ],
  p4: [
    {
      id: 'c4', postId: 'p4', author: users[1], body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Hemp fashion is truly the future of sustainable clothing!', createdAt: '2024-12-16T09:00:00Z', votes: 14, userVote: 0, payout: 1.12,
      replies: [
        { id: 'c4r1', postId: 'p4', author: users[2], body: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Completely agree with this take.', createdAt: '2024-12-16T10:30:00Z', votes: 6, userVote: 0, replies: [], payout: 0.38 },
      ],
    },
    { id: 'c5', postId: 'p4', author: users[3], body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. I just ordered my first hemp shirt and the quality is amazing.', createdAt: '2024-12-16T11:00:00Z', votes: 9, userVote: 0, replies: [], payout: 0.67 },
    { id: 'c6', postId: 'p4', author: users[0], body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. The environmental impact data here is eye-opening.', createdAt: '2024-12-16T13:45:00Z', votes: 7, userVote: 0, replies: [], payout: 0.48 },
    {
      id: 'c7', postId: 'p4', author: users[4], body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Would love to see more brands adopt hemp fabrics.', createdAt: '2024-12-16T15:20:00Z', votes: 11, userVote: 0, payout: 0.89,
      replies: [
        { id: 'c7r1', postId: 'p4', author: users[1], body: 'Lorem ipsum dolor sit amet — there are actually quite a few indie brands already doing this!', createdAt: '2024-12-16T16:00:00Z', votes: 3, userVote: 0, replies: [], payout: 0.18 },
        { id: 'c7r2', postId: 'p4', author: users[3], body: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur. Check out some of the hemp marketplaces online.', createdAt: '2024-12-16T16:30:00Z', votes: 2, userVote: 0, replies: [], payout: 0.12 },
      ],
    },
    { id: 'c8', postId: 'p4', author: users[2], body: 'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur. Fantastic read, thanks for sharing!', createdAt: '2024-12-17T08:00:00Z', votes: 5, userVote: 0, replies: [], payout: 0.35 },
  ],
};

const tags: Tag[] = [
  { name: 'hempire', postCount: 156, trending: true },
  { name: 'cultivation', postCount: 89, trending: true },
  { name: 'medical', postCount: 73, trending: true },
  { name: 'strains', postCount: 120, trending: false },
  { name: 'cbd', postCount: 64, trending: true },
  { name: 'hemp', postCount: 45, trending: false },
  { name: 'sustainability', postCount: 38, trending: false },
  { name: 'terpenes', postCount: 52, trending: true },
  { name: 'education', postCount: 91, trending: false },
  { name: 'culture', postCount: 67, trending: false },
  { name: 'reviews', postCount: 83, trending: false },
  { name: 'wellness', postCount: 56, trending: true },
];

const notifications: Notification[] = [
  { id: 'n1', type: 'vote', actor: users[1], postId: 'p1', postTitle: 'The Complete Guide to Organic Cannabis Cultivation', message: 'upvoted your post', createdAt: '2024-12-15T15:00:00Z', read: false },
  { id: 'n2', type: 'comment', actor: users[2], postId: 'p1', postTitle: 'The Complete Guide to Organic Cannabis Cultivation', message: 'commented on your post', createdAt: '2024-12-15T14:30:00Z', read: false },
  { id: 'n3', type: 'follow', actor: users[3], message: 'started following you', createdAt: '2024-12-14T10:00:00Z', read: true },
  { id: 'n4', type: 'mention', actor: users[1], postId: 'p4', postTitle: 'The Rise of Hemp Fashion', message: 'mentioned you in a post', createdAt: '2024-12-13T08:00:00Z', read: true },
];

const walletHistory: WalletTransaction[] = [
  { id: 'w1', type: 'author_reward', amount: '12.450', currency: 'SBD', timestamp: '2024-12-15T00:00:00Z' },
  { id: 'w2', type: 'curation_reward', amount: '0.850', currency: 'SP', timestamp: '2024-12-14T00:00:00Z' },
  { id: 'w3', type: 'transfer', amount: '50.000', currency: 'STEEM', timestamp: '2024-12-13T00:00:00Z', memo: 'Payment for article' },
  { id: 'w4', type: 'author_reward', amount: '8.750', currency: 'SBD', timestamp: '2024-12-12T00:00:00Z' },
  { id: 'w5', type: 'curation_reward', amount: '1.200', currency: 'SP', timestamp: '2024-12-11T00:00:00Z' },
];

const community: Community = {
  name: 'hempire', title: 'Hempire',
  description: 'The premier cannabis community on Steem. Sharing knowledge, culture, and advocacy for the plant we love.',
  members: 2847, pendingRewards: '1,245.32 SBD', activePosters: 156, subscribers: 3200,
};

const forumThreads: ForumThread[] = [
  {
    id: 'ft1', title: 'Best organic nutrients for indoor grows?',
    body: `<p>I've been experimenting with different organic nutrient lines for indoor cannabis cultivation. Currently using a living soil mix but wondering if anyone has experience with Korean Natural Farming (KNF) inputs.</p>
<p>Here's my current setup:</p>
<img src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=80" alt="Indoor grow setup" />
<p>The plants are doing well but I feel like the nutrient uptake could be better. What are your favorites for indoor growing? Looking for something that works well in living soil without burning the plants.</p>
<h3>My current nutrient schedule:</h3>
<ul><li>Week 1-2: Compost tea only</li><li>Week 3-6: Fish hydrolysate + kelp</li><li>Week 7+: Bloom amendments (bone meal, bat guano)</li></ul>`,
    author: contributors[0], createdAt: '2024-12-14T10:00:00Z', replyCount: 23, lastReplyAt: '2024-12-15T18:00:00Z',
    pinned: true, tags: ['cultivation', 'organic'], votes: 45,
  },
  {
    id: 'ft2', title: 'Community guidelines update — please read',
    body: `<p>We've updated the community guidelines to better reflect our values. Key changes include clearer rules on sourcing claims and a new mentorship program for new growers.</p>
<h3>Key Changes:</h3>
<ol><li>No unverified health claims about cannabis products</li><li>All grow advice must include safety disclaimers</li><li>New mentorship program: experienced growers can volunteer to guide newcomers</li><li>Updated content formatting standards for better readability</li></ol>
<p>Please review the full guidelines and share your feedback below. We want this to be a community decision.</p>`,
    author: contributors[3], createdAt: '2024-12-13T08:00:00Z', replyCount: 12, lastReplyAt: '2024-12-15T14:00:00Z',
    pinned: true, tags: ['community', 'rules'], votes: 67,
  },
  {
    id: 'ft3', title: 'Terpene profiles: Myrcene vs Limonene — share your experiences',
    body: `<p>Let's discuss the differences in effects between myrcene-dominant and limonene-dominant strains. I've been keeping a terpene journal for 6 months and the results are fascinating.</p>
<img src="https://images.unsplash.com/photo-1457530378978-8bac673b8062?w=800&q=80" alt="Terpene chart" />
<h3>My observations:</h3>
<p><strong>Myrcene-dominant strains</strong> (like OG Kush, Blue Dream): More body-heavy, sedating, great for evening use. The "couch-lock" effect is real.</p>
<p><strong>Limonene-dominant strains</strong> (like Super Lemon Haze, Tangie): Uplifting, energetic, better for daytime. Noticeable mood elevation.</p>
<p>Check out this great video explaining the entourage effect:</p>
<div class="video-embed"><iframe width="100%" height="315" src="https://www.youtube.com/embed/S1iFNJOmgFE" frameborder="0" allowfullscreen></iframe></div>
<p>Share your personal experiences! Do you notice terpene differences, or is it all about THC/CBD ratios for you?</p>`,
    author: contentCreators[1], createdAt: '2024-12-12T15:30:00Z', replyCount: 34, lastReplyAt: '2024-12-15T16:00:00Z',
    pinned: false, tags: ['terpenes', 'discussion'], votes: 38,
  },
  {
    id: 'ft4', title: 'Hemp textile sourcing — any reliable suppliers?',
    body: `<p>Looking for quality hemp fabric suppliers for a small clothing line. Need consistent quality and reasonable MOQs.</p>
<img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80" alt="Hemp textiles" />
<p>I've tried a few suppliers from Alibaba but the quality has been inconsistent. Anyone have direct relationships with mills? Specifically looking for:</p>
<ul><li>Hemp/organic cotton blends (55/45)</li><li>Pure hemp canvas for bags</li><li>Hemp jersey knit for t-shirts</li></ul>
<p>Budget is around $8-12/yard for blends. Happy to share contacts I've tried if anyone is interested.</p>`,
    author: contributors[1], createdAt: '2024-12-11T12:00:00Z', replyCount: 18, lastReplyAt: '2024-12-14T20:00:00Z',
    pinned: false, tags: ['hemp', 'business'], votes: 22,
  },
  {
    id: 'ft5', title: 'Edibles dosing calculator — feedback wanted',
    body: `<p>I built a simple dosing calculator for homemade edibles. Would love community feedback before I publish it as a post.</p>
<p>The formula accounts for:</p>
<ul><li>Decarboxylation efficiency (~87-90%)</li><li>Infusion method (butter vs oil vs alcohol)</li><li>Serving size calculations</li><li>THC/CBD ratio inputs</li></ul>
<p>Here's a quick demo of how it works:</p>
<div class="video-embed"><iframe width="100%" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div>
<p>Would you use something like this? What features would make it more useful?</p>`,
    author: contentCreators[2], createdAt: '2024-12-10T09:00:00Z', replyCount: 41, lastReplyAt: '2024-12-15T11:00:00Z',
    pinned: false, tags: ['edibles', 'tools'], votes: 56,
  },
  {
    id: 'ft6', title: 'LED vs HPS in 2024 — the debate continues',
    body: `<p>With the latest generation of LED grow lights hitting the market, is there still any reason to run HPS? I recently switched my 4x4 tent from a 600W HPS to a 480W LED bar light and the results speak for themselves.</p>
<img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80" alt="LED grow light" />
<h3>My comparison after 3 runs:</h3>
<table><tr><th>Metric</th><th>HPS</th><th>LED</th></tr><tr><td>Yield (g/plant)</td><td>125g</td><td>140g</td></tr><tr><td>Electricity (monthly)</td><td>$85</td><td>$52</td></tr><tr><td>Canopy temp</td><td>82°F</td><td>76°F</td></tr></table>
<p>The LED runs cooler, uses less power, and actually increased my yield. What's your experience?</p>`,
    author: contributors[2], createdAt: '2024-12-09T14:00:00Z', replyCount: 29, lastReplyAt: '2024-12-15T09:00:00Z',
    pinned: false, tags: ['cultivation', 'equipment'], votes: 73,
  },
  {
    id: 'ft7', title: 'Cannabis photography tips — capturing trichomes',
    body: `<p>As a cannabis photographer, I get asked all the time how I capture those stunning macro shots of trichomes. Here's a quick breakdown of my setup and technique.</p>
<img src="https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800&q=80" alt="Cannabis macro photography" />
<h3>Gear:</h3>
<ul><li>Camera: Any mirrorless with good macro capability</li><li>Lens: 100mm macro (or clip-on macro for phones)</li><li>Lighting: Ring light or diffused LED panel</li><li>Tripod: Essential — even slight movement ruins macro shots</li></ul>
<p>Check out this tutorial that helped me get started:</p>
<div class="video-embed"><iframe width="100%" height="315" src="https://www.youtube.com/embed/9bZkp7q19f0" frameborder="0" allowfullscreen></iframe></div>
<p>Share your best cannabis macro shots below! 📸</p>`,
    author: contentCreators[3], createdAt: '2024-12-08T11:00:00Z', replyCount: 15, lastReplyAt: '2024-12-14T17:00:00Z',
    pinned: false, tags: ['photography', 'culture'], votes: 41,
  },
];

const forumReplies: Record<string, ForumReply[]> = {
  ft1: [
    {
      id: 'fr1', threadId: 'ft1', author: contentCreators[1], votes: 12, userVote: 0,
      createdAt: '2024-12-14T11:30:00Z',
      body: `<p>Great setup! I've been using KNF inputs for about a year now and the difference is night and day. The fermented plant juice (FPJ) made from comfrey is amazing for flowering.</p>
<p>Here's a video that got me started with KNF:</p>
<div class="video-embed"><iframe width="100%" height="315" src="https://www.youtube.com/embed/S1iFNJOmgFE" frameborder="0" allowfullscreen></iframe></div>`,
      replies: [
        { id: 'fr1r1', threadId: 'ft1', author: contributors[0], body: '<p>Thanks! I\'ll definitely check out KNF. Do you make your own FPJ or buy it pre-made?</p>', createdAt: '2024-12-14T12:00:00Z', votes: 3, userVote: 0, replies: [] },
        { id: 'fr1r2', threadId: 'ft1', author: contentCreators[1], body: '<p>Always homemade! It\'s super easy — just chop up comfrey leaves, mix with equal weight brown sugar, and ferment for 7 days. Way cheaper than store-bought.</p>', createdAt: '2024-12-14T12:30:00Z', votes: 8, userVote: 0, replies: [] },
      ],
    },
    {
      id: 'fr2', threadId: 'ft1', author: contributors[3], votes: 18, userVote: 0,
      createdAt: '2024-12-14T13:00:00Z',
      body: `<p>From a scientific perspective, the microbial diversity in living soil is what drives nutrient availability. I'd recommend getting a soil test done — many growers over-amend without knowing their soil's baseline.</p>
<img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80" alt="Soil testing" />
<p>A simple $30 soil test can save you hundreds in unnecessary amendments.</p>`,
      replies: [
        { id: 'fr2r1', threadId: 'ft1', author: contributors[2], body: '<p>This 100%! I was over-amending for months until I got a soil test. Turns out my phosphorus levels were already through the roof.</p>', createdAt: '2024-12-14T14:00:00Z', votes: 6, userVote: 0, replies: [] },
      ],
    },
    {
      id: 'fr3', threadId: 'ft1', author: contentCreators[2], votes: 9, userVote: 0,
      createdAt: '2024-12-14T15:00:00Z',
      body: '<p>I swear by Buildasoil\'s 3.0 mix. It\'s pricey but you literally just add water for the first run. After that, you can re-amend with cover crop and top-dress. Super low maintenance.</p>',
      replies: [],
    },
    {
      id: 'fr4', threadId: 'ft1', author: contributors[1], votes: 14, userVote: 0,
      createdAt: '2024-12-14T16:30:00Z',
      body: `<p>Don't sleep on worm castings! They're the single best amendment you can add to any soil. I produce my own vermicompost and it's a game changer.</p>
<img src="https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800&q=80" alt="Vermicompost" />`,
      replies: [
        { id: 'fr4r1', threadId: 'ft1', author: contributors[0], body: '<p>I\'ve been meaning to start a worm bin! Any tips on getting started? What species do you use?</p>', createdAt: '2024-12-14T17:00:00Z', votes: 2, userVote: 0, replies: [] },
        { id: 'fr4r1r2', threadId: 'ft1', author: contributors[1], body: '<p>Red wigglers (Eisenia fetida) are the best for composting. Start with about 1 lb of worms in a basic bin with shredded newspaper bedding. Feed them your kitchen scraps. Within 3 months you\'ll have amazing castings!</p>', createdAt: '2024-12-14T17:30:00Z', votes: 7, userVote: 0, replies: [] },
      ],
    },
    {
      id: 'fr5', threadId: 'ft1', author: contentCreators[0], votes: 11, userVote: 0,
      createdAt: '2024-12-14T19:00:00Z',
      body: '<p>Has anyone tried Jadam organic farming methods? It\'s similar to KNF but even more simplified. You basically make all your inputs from local plants and microorganisms. The book by Youngsang Cho is excellent.</p>',
      replies: [],
    },
    {
      id: 'fr6', threadId: 'ft1', author: contentCreators[3], votes: 5, userVote: 0,
      createdAt: '2024-12-15T08:00:00Z',
      body: '<p>I photographed a living soil comparison grow last month — the difference in trichome production between synthetic and organic was visible even to the naked eye. Organic plants had significantly more frost. Will post the full photo series soon!</p>',
      replies: [],
    },
  ],
  ft2: [
    {
      id: 'fr7', threadId: 'ft2', author: contributors[0], votes: 22, userVote: 0,
      createdAt: '2024-12-13T09:30:00Z',
      body: '<p>Love the mentorship program idea! I\'d be happy to volunteer as a mentor for new growers. Been growing for 8 years and would love to give back to the community.</p>',
      replies: [
        { id: 'fr7r1', threadId: 'ft2', author: contributors[3], body: '<p>That\'s awesome @greenleaf! I\'ll add you to the mentor list. We\'re aiming to launch the program in January.</p>', createdAt: '2024-12-13T10:00:00Z', votes: 8, userVote: 0, replies: [] },
      ],
    },
    {
      id: 'fr8', threadId: 'ft2', author: contentCreators[0], votes: 15, userVote: 0,
      createdAt: '2024-12-13T11:00:00Z',
      body: '<p>The health claims rule is important. I\'ve seen too many posts making unsubstantiated medical claims. We should encourage people to share personal experiences while being clear they\'re not medical advice.</p>',
      replies: [],
    },
    {
      id: 'fr9', threadId: 'ft2', author: contentCreators[2], votes: 10, userVote: 0,
      createdAt: '2024-12-13T14:00:00Z',
      body: '<p>For the edibles content specifically — I think we should require dosing information and a "start low, go slow" disclaimer on every edibles post. Safety first! 🍪</p>',
      replies: [
        { id: 'fr9r1', threadId: 'ft2', author: contributors[3], body: '<p>Great suggestion! Adding that to the guidelines now. Edibles posts will require dosing info and safety disclaimers.</p>', createdAt: '2024-12-13T15:00:00Z', votes: 12, userVote: 0, replies: [] },
      ],
    },
  ],
  ft3: [
    {
      id: 'fr10', threadId: 'ft3', author: contributors[2], votes: 20, userVote: 0,
      createdAt: '2024-12-12T16:30:00Z',
      body: `<p>As a budtender, I can confirm terpenes make a massive difference. I always recommend customers choose by terpene profile over THC percentage. Here's what I tell people:</p>
<ul><li><strong>Want to relax?</strong> Look for myrcene + linalool</li><li><strong>Want energy?</strong> Look for limonene + terpinolene</li><li><strong>Want focus?</strong> Look for pinene + limonene</li></ul>`,
      replies: [
        { id: 'fr10r1', threadId: 'ft3', author: contentCreators[1], body: '<p>This is such a great cheat sheet! Mind if I reference this in my upcoming terpene guide article?</p>', createdAt: '2024-12-12T17:00:00Z', votes: 5, userVote: 0, replies: [] },
        { id: 'fr10r2', threadId: 'ft3', author: contributors[2], body: '<p>Go for it! Happy to help review the draft too if you need another set of eyes.</p>', createdAt: '2024-12-12T17:30:00Z', votes: 3, userVote: 0, replies: [] },
      ],
    },
    {
      id: 'fr11', threadId: 'ft3', author: contributors[0], votes: 16, userVote: 0,
      createdAt: '2024-12-12T18:00:00Z',
      body: `<p>I grew the same strain (Blue Dream) in two different environments and got completely different terpene profiles. Indoor had more myrcene, outdoor had more pinene. Environment matters just as much as genetics!</p>
<img src="https://images.unsplash.com/photo-1536819114556-1e10f967fb61?w=800&q=80" alt="Blue Dream comparison" />`,
      replies: [],
    },
    {
      id: 'fr12', threadId: 'ft3', author: contentCreators[3], votes: 8, userVote: 0,
      createdAt: '2024-12-13T09:00:00Z',
      body: '<p>I did a terpene-focused photo series where I tried to capture the "mood" of different terpene profiles through color grading and composition. Myrcene = warm earthy tones, Limonene = bright citrus vibes. Art imitating science! 🎨</p>',
      replies: [],
    },
  ],
  ft4: [
    {
      id: 'fr13', threadId: 'ft4', author: contentCreators[0], votes: 14, userVote: 0,
      createdAt: '2024-12-11T13:00:00Z',
      body: '<p>I wrote an article last year about hemp textile supply chains. The best suppliers I found were in Romania and China (Heilongjiang province specifically). DM me and I can share my contact list.</p>',
      replies: [],
    },
    {
      id: 'fr14', threadId: 'ft4', author: contributors[3], votes: 9, userVote: 0,
      createdAt: '2024-12-11T15:00:00Z',
      body: '<p>Check out EnviroTextiles in Colorado — they source directly from European mills and the quality is excellent. Their hemp/cotton blends are around $10/yard which fits your budget.</p>',
      replies: [
        { id: 'fr14r1', threadId: 'ft4', author: contributors[1], body: '<p>Thanks! Just emailed them for a sample pack. Fingers crossed! 🤞</p>', createdAt: '2024-12-11T16:00:00Z', votes: 4, userVote: 0, replies: [] },
      ],
    },
  ],
  ft5: [
    {
      id: 'fr15', threadId: 'ft5', author: contributors[0], votes: 25, userVote: 0,
      createdAt: '2024-12-10T10:00:00Z',
      body: '<p>This is exactly what the community needs! One suggestion: add an option for different infusion methods because butter and coconut oil have different fat content, which affects THC absorption rate.</p>',
      replies: [],
    },
    {
      id: 'fr16', threadId: 'ft5', author: contributors[3], votes: 19, userVote: 0,
      createdAt: '2024-12-10T11:30:00Z',
      body: `<p>From a medical perspective, I'd love to see the calculator include CBD:THC ratio options. Many patients need specific ratios and getting the math right is crucial for consistent dosing.</p>
<p>Also, please add a prominent warning about onset time differences between edibles and inhalation — this is the #1 cause of overconsumption among new users.</p>`,
      replies: [
        { id: 'fr16r1', threadId: 'ft5', author: contentCreators[2], body: '<p>Great suggestions! Adding CBD ratio support and safety warnings to the next version. The onset time difference is so important — will make that very prominent.</p>', createdAt: '2024-12-10T12:00:00Z', votes: 11, userVote: 0, replies: [] },
      ],
    },
    {
      id: 'fr17', threadId: 'ft5', author: contentCreators[1], votes: 7, userVote: 0,
      createdAt: '2024-12-10T14:00:00Z',
      body: '<p>Would be great to see a "bioavailability" factor in the calculation. Not all of the THC you put in actually ends up active. Decarb efficiency, infusion losses, and digestion all reduce the final dose.</p>',
      replies: [],
    },
  ],
  ft6: [
    {
      id: 'fr18', threadId: 'ft6', author: contributors[0], votes: 30, userVote: 0,
      createdAt: '2024-12-09T15:00:00Z',
      body: `<p>Switched to LEDs 2 years ago and never looked back. The spectrum control alone is worth it. I run different spectrums for veg vs flower and the results are incredible.</p>
<img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80" alt="LED grow" />`,
      replies: [
        { id: 'fr18r1', threadId: 'ft6', author: contributors[2], body: '<p>What spectrum do you run during flower? I\'ve been experimenting with adding more far-red during the last 2 weeks.</p>', createdAt: '2024-12-09T16:00:00Z', votes: 8, userVote: 0, replies: [] },
      ],
    },
    {
      id: 'fr19', threadId: 'ft6', author: contentCreators[0], votes: 12, userVote: 0,
      createdAt: '2024-12-09T17:00:00Z',
      body: '<p>I covered the LED revolution in an article last month. The efficiency gains in the latest Samsung LM301H diodes are remarkable — over 3 µmol/J now. HPS tops out around 1.7 µmol/J. The math doesn\'t lie.</p>',
      replies: [],
    },
  ],
  ft7: [
    {
      id: 'fr20', threadId: 'ft7', author: contributors[2], votes: 11, userVote: 0,
      createdAt: '2024-12-08T12:00:00Z',
      body: '<p>Great tips! I use my phone with a clip-on macro lens and get surprisingly good results. The key really is lighting — natural sunlight through a window works beautifully for trichome shots.</p>',
      replies: [],
    },
    {
      id: 'fr21', threadId: 'ft7', author: contentCreators[1], votes: 8, userVote: 0,
      createdAt: '2024-12-08T14:00:00Z',
      body: `<p>What aperture do you shoot at for the trichome closeups? I find anything wider than f/5.6 gives too shallow a depth of field at macro distances.</p>
<p>Also, focus stacking is a game changer for macro cannabis photography. You take multiple shots at different focus points and merge them in post.</p>`,
      replies: [
        { id: 'fr21r1', threadId: 'ft7', author: contentCreators[3], body: '<p>I usually shoot between f/8 and f/11 for the sweet spot. And yes, focus stacking is essential! I use Helicon Focus for merging — it handles the blending beautifully.</p>', createdAt: '2024-12-08T15:00:00Z', votes: 6, userVote: 0, replies: [] },
      ],
    },
  ],
};

const pollsData: Poll[] = [
  {
    id: 'poll1', title: 'What\'s your preferred consumption method?',
    description: 'Help us understand community preferences for our upcoming guide. We want to know how our community prefers to consume cannabis so we can tailor content and recommendations. Your vote will directly influence the topics we cover in our next series of articles.',
    author: contributors[3], createdAt: '2024-12-10T10:00:00Z', endsAt: '2026-12-20T10:00:00Z',
    options: [
      { id: 'po1', label: 'Flower / Smoking', votes: 142 },
      { id: 'po2', label: 'Vaporizing', votes: 98 },
      { id: 'po3', label: 'Edibles', votes: 76 },
      { id: 'po4', label: 'Tinctures / Oils', votes: 45 },
    ],
    totalVotes: 361, closed: false, payout: 12.45, commentCount: 8, votes: 42, userVote: 0,
    tags: ['cannabis', 'community', 'survey'],
  },
  {
    id: 'poll2', title: 'Should Hempire host a virtual grow-along?',
    description: 'We\'re considering a community grow-along event where everyone starts seeds on the same day. Share your thoughts and let us know if you\'d participate! The idea is to document the entire journey from seed to harvest as a collective, with weekly check-ins and Q&A sessions.',
    author: contributors[0], createdAt: '2024-12-08T14:00:00Z', endsAt: '2026-12-18T14:00:00Z',
    options: [
      { id: 'po5', label: 'Yes, absolutely!', votes: 234 },
      { id: 'po6', label: 'Maybe, need more details', votes: 89 },
      { id: 'po7', label: 'Not interested', votes: 31 },
    ],
    totalVotes: 354, closed: false, payout: 8.72, commentCount: 15, votes: 67, userVote: 0,
    tags: ['growing', 'community', 'events'],
  },
  {
    id: 'poll3', title: 'Favorite cannabis-related book?',
    description: 'Building a community reading list. Drop your favorites and let\'s see what the community recommends most. We\'ll compile the results into a curated "Hempire Reading List" and feature reviews of the top picks.',
    author: contentCreators[0], createdAt: '2024-11-20T10:00:00Z', endsAt: '2024-12-05T10:00:00Z',
    options: [
      { id: 'po8', label: 'The Emperor Wears No Clothes', votes: 89 },
      { id: 'po9', label: 'Cannabis Pharmacy', votes: 67 },
      { id: 'po10', label: 'Smoke Signals', votes: 45 },
      { id: 'po11', label: 'The Cannabis Manifesto', votes: 38 },
    ],
    totalVotes: 239, closed: true, payout: 5.30, commentCount: 22, votes: 31, userVote: 1,
    tags: ['books', 'education', 'culture'],
  },
  {
    id: 'poll4', title: 'Best hemp fabric for everyday clothing?',
    description: 'Hemp textiles are evolving rapidly with new blending techniques and finishing processes. We\'re partnering with sustainable fashion brands to develop a Hempire-approved clothing line. Your feedback will help us decide which fabric types to prioritize — consider comfort, durability, breathability, and environmental impact.',
    author: contentCreators[2], createdAt: '2024-12-12T09:00:00Z', endsAt: '2026-12-25T09:00:00Z',
    options: [
      { id: 'po12', label: '100% Hemp (raw & textured)', votes: 67 },
      { id: 'po13', label: 'Hemp-Cotton Blend (55/45)', votes: 124 },
      { id: 'po14', label: 'Hemp-Tencel Blend (soft finish)', votes: 89 },
      { id: 'po15', label: 'Hemp-Linen Blend (lightweight)', votes: 53 },
      { id: 'po16', label: 'Hemp Silk (luxury feel)', votes: 41 },
    ],
    totalVotes: 374, closed: false, payout: 15.80, commentCount: 12, votes: 55, userVote: 0,
    tags: ['fashion', 'hemp', 'sustainability', 'textiles'],
  },
  {
    id: 'poll5', title: 'Which terpene profile do you prefer?',
    description: 'Terpenes are the aromatic compounds that give cannabis its distinctive flavors and contribute to the entourage effect. Understanding community preferences helps breeders and product developers create strains that resonate with consumers. Whether you love the citrusy zing of limonene or the earthy calm of myrcene, your vote matters!',
    author: contentCreators[1], createdAt: '2024-12-05T16:00:00Z', endsAt: '2026-12-30T16:00:00Z',
    options: [
      { id: 'po17', label: 'Myrcene (earthy, musky, herbal)', votes: 156 },
      { id: 'po18', label: 'Limonene (citrus, uplifting)', votes: 132 },
      { id: 'po19', label: 'Pinene (pine, fresh, alert)', votes: 78 },
      { id: 'po20', label: 'Linalool (floral, calming)', votes: 95 },
      { id: 'po21', label: 'Caryophyllene (spicy, peppery)', votes: 64 },
    ],
    totalVotes: 525, closed: false, payout: 22.15, commentCount: 18, votes: 89, userVote: 0,
    tags: ['terpenes', 'science', 'strains', 'flavor'],
  },
  {
    id: 'poll6', title: 'What cannabis topic should we deep-dive next?',
    description: 'Our editorial team is planning the next big investigative series and we want community input. Each option represents a 4-part article series with expert interviews, data analysis, and community perspectives. The winning topic kicks off in January with weekly installments.',
    author: contributors[1], createdAt: '2024-12-01T12:00:00Z', endsAt: '2026-12-15T12:00:00Z',
    options: [
      { id: 'po22', label: 'Cannabis & Mental Health', votes: 198 },
      { id: 'po23', label: 'Global Legalization Progress', votes: 167 },
      { id: 'po24', label: 'Sustainable Growing Practices', votes: 145 },
      { id: 'po25', label: 'Cannabis in Traditional Medicine', votes: 112 },
    ],
    totalVotes: 622, closed: false, payout: 18.90, commentCount: 25, votes: 103, userVote: 0,
    tags: ['editorial', 'community', 'research'],
  },
  {
    id: 'poll7', title: 'How often do you consume cannabis?',
    description: 'This anonymous survey helps us understand consumption patterns in our community. The data will be used in an upcoming article about responsible use and harm reduction strategies. All responses are aggregated — no individual data is tracked.',
    author: contributors[3], createdAt: '2024-11-15T10:00:00Z', endsAt: '2024-12-01T10:00:00Z',
    options: [
      { id: 'po26', label: 'Daily', votes: 187 },
      { id: 'po27', label: 'A few times a week', votes: 143 },
      { id: 'po28', label: 'Weekends only', votes: 89 },
      { id: 'po29', label: 'Occasionally (1-2x/month)', votes: 76 },
      { id: 'po30', label: 'Rarely / Trying it out', votes: 34 },
    ],
    totalVotes: 529, closed: true, payout: 9.45, commentCount: 14, votes: 47, userVote: 1,
    tags: ['survey', 'health', 'community'],
  },
  {
    id: 'poll8', title: 'Best strain for creative work?',
    description: 'Many artists, writers, and musicians in our community use cannabis as part of their creative process. We want to know which strains our members find most conducive to creative flow. Results will be featured in our "Cannabis & Creativity" spotlight article.',
    author: contentCreators[3], createdAt: '2024-12-14T08:00:00Z', endsAt: '2026-12-28T08:00:00Z',
    options: [
      { id: 'po31', label: 'Jack Herer', votes: 112 },
      { id: 'po32', label: 'Blue Dream', votes: 98 },
      { id: 'po33', label: 'Durban Poison', votes: 67 },
      { id: 'po34', label: 'Green Crack', votes: 54 },
      { id: 'po35', label: 'Sour Diesel', votes: 81 },
    ],
    totalVotes: 412, closed: false, payout: 14.20, commentCount: 20, votes: 76, userVote: 0,
    tags: ['strains', 'creativity', 'reviews'],
  },
];

// Poll comments with deep nested replies
const pollComments: Record<string, Comment[]> = {
  poll1: [
    { id: 'pc1', postId: 'poll1', author: contributors[0], body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vaporizing has really changed the game for me personally.', createdAt: '2024-12-11T08:00:00Z', votes: 5, userVote: 0, replies: [
      { id: 'pc1r1', postId: 'poll1', author: contributors[2], body: 'Sed do eiusmod tempor incididunt ut labore. I agree, the flavor profile is so much better with a good vaporizer.', createdAt: '2024-12-11T09:30:00Z', votes: 3, userVote: 0, replies: [
        { id: 'pc1r1a', postId: 'poll1', author: contentCreators[2], body: 'Absolutely! Lorem ipsum dolor sit amet. The temperature control makes all the difference for terpene preservation.', createdAt: '2024-12-11T10:15:00Z', votes: 2, userVote: 0, replies: [], payout: 0.08 },
      ], payout: 0.15 },
    ], payout: 0.42 },
    { id: 'pc2', postId: 'poll1', author: contentCreators[1], body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Edibles are underrated for long-lasting effects.', createdAt: '2024-12-11T12:00:00Z', votes: 8, userVote: 0, replies: [
      { id: 'pc2r1', postId: 'poll1', author: contributors[3], body: 'From a medical perspective, edibles provide the most consistent dosing. Lorem ipsum dolor sit amet.', createdAt: '2024-12-11T13:00:00Z', votes: 6, userVote: 0, replies: [
        { id: 'pc2r1a', postId: 'poll1', author: contributors[1], body: 'Consectetur adipiscing elit! That\'s exactly why I switched from smoking to edibles last year.', createdAt: '2024-12-11T14:30:00Z', votes: 4, userVote: 0, replies: [], payout: 0.12 },
      ], payout: 0.38 },
    ], payout: 0.68 },
    { id: 'pc3', postId: 'poll1', author: contributors[1], body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.', createdAt: '2024-12-12T06:00:00Z', votes: 2, userVote: 0, replies: [], payout: 0.21 },
  ],
  poll2: [
    { id: 'pc4', postId: 'poll2', author: contentCreators[0], body: 'Excepteur sint occaecat cupidatat non proident. A grow-along would be amazing for beginners like me!', createdAt: '2024-12-09T10:00:00Z', votes: 12, userVote: 0, replies: [
      { id: 'pc4r1', postId: 'poll2', author: contributors[0], body: 'Lorem ipsum dolor sit amet! We could set up weekly check-ins and share progress photos.', createdAt: '2024-12-09T11:00:00Z', votes: 6, userVote: 0, replies: [
        { id: 'pc4r1a', postId: 'poll2', author: contentCreators[2], body: 'Sed ut perspiciatis unde omnis iste natus error. Maybe different difficulty tracks for beginners vs experienced?', createdAt: '2024-12-09T12:30:00Z', votes: 8, userVote: 0, replies: [
          { id: 'pc4r1a1', postId: 'poll2', author: contributors[0], body: 'Great idea! We could have "seedling", "vegetative", and "master" tracks. Lorem ipsum dolor sit amet.', createdAt: '2024-12-09T13:00:00Z', votes: 5, userVote: 0, replies: [], payout: 0.22 },
        ], payout: 0.45 },
      ], payout: 0.35 },
      { id: 'pc4r2', postId: 'poll2', author: contributors[3], body: 'Consectetur adipiscing elit, sed do eiusmod tempor. I could provide medical growing tips along the way.', createdAt: '2024-12-09T14:00:00Z', votes: 9, userVote: 0, replies: [], payout: 0.52 },
    ], payout: 1.15 },
    { id: 'pc5', postId: 'poll2', author: contributors[2], body: 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis. Count me in for the grow-along!', createdAt: '2024-12-10T08:00:00Z', votes: 4, userVote: 0, replies: [
      { id: 'pc5r1', postId: 'poll2', author: contentCreators[3], body: 'Nemo enim ipsam voluptatem quia voluptas sit. I\'d love to document the process through illustrations!', createdAt: '2024-12-10T09:30:00Z', votes: 7, userVote: 0, replies: [], payout: 0.32 },
    ], payout: 0.28 },
  ],
  poll3: [
    { id: 'pc6', postId: 'poll3', author: contributors[1], body: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur. Emperor Wears No Clothes is a must-read classic.', createdAt: '2024-11-21T10:00:00Z', votes: 7, userVote: 0, replies: [
      { id: 'pc6r1', postId: 'poll3', author: contentCreators[0], body: 'Lorem ipsum dolor sit amet. Jack Herer\'s work completely changed how I think about hemp policy.', createdAt: '2024-11-21T12:00:00Z', votes: 5, userVote: 0, replies: [
        { id: 'pc6r1a', postId: 'poll3', author: contributors[0], body: 'Ut enim ad minim veniam. Should be required reading for anyone in the cannabis space honestly.', createdAt: '2024-11-21T14:00:00Z', votes: 3, userVote: 0, replies: [], payout: 0.11 },
      ], payout: 0.28 },
    ], payout: 0.55 },
    { id: 'pc7', postId: 'poll3', author: contributors[3], body: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet. Cannabis Pharmacy is excellent for medical reference.', createdAt: '2024-11-22T15:00:00Z', votes: 5, userVote: 0, replies: [
      { id: 'pc7r1', postId: 'poll3', author: contentCreators[1], body: 'Quis autem vel eum iure reprehenderit qui in ea voluptate. The most comprehensive guide out there.', createdAt: '2024-11-22T17:00:00Z', votes: 3, userVote: 0, replies: [
        { id: 'pc7r1a', postId: 'poll3', author: contributors[2], body: 'Duis aute irure dolor in reprehenderit. I keep a copy on my desk for quick reference!', createdAt: '2024-11-22T18:30:00Z', votes: 2, userVote: 0, replies: [], payout: 0.09 },
      ], payout: 0.18 },
    ], payout: 0.44 },
    { id: 'pc8', postId: 'poll3', author: contentCreators[2], body: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem. Don\'t sleep on Smoke Signals — incredible storytelling.', createdAt: '2024-11-23T09:00:00Z', votes: 4, userVote: 0, replies: [], payout: 0.33 },
  ],
  poll4: [
    { id: 'pc9', postId: 'poll4', author: contributors[1], body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Hemp-cotton blends are the sweet spot — soft but durable.', createdAt: '2024-12-13T08:00:00Z', votes: 9, userVote: 0, replies: [
      { id: 'pc9r1', postId: 'poll4', author: contentCreators[2], body: 'Ut enim ad minim veniam. I\'ve been making clothes with hemp-cotton for years and the durability is unmatched.', createdAt: '2024-12-13T09:30:00Z', votes: 7, userVote: 0, replies: [
        { id: 'pc9r1a', postId: 'poll4', author: contributors[2], body: 'Sed do eiusmod tempor incididunt. How many washes before it softens? First few wears feel a bit stiff.', createdAt: '2024-12-13T10:45:00Z', votes: 4, userVote: 0, replies: [
          { id: 'pc9r1a1', postId: 'poll4', author: contentCreators[2], body: 'Duis aute irure dolor. Usually 3-5 washes — the key is washing with vinegar the first time!', createdAt: '2024-12-13T11:30:00Z', votes: 6, userVote: 0, replies: [], payout: 0.28 },
        ], payout: 0.15 },
      ], payout: 0.42 },
    ], payout: 0.75 },
    { id: 'pc10', postId: 'poll4', author: contentCreators[3], body: 'Excepteur sint occaecat cupidatat. As an artist, I love raw hemp texture — it adds character to garments.', createdAt: '2024-12-13T14:00:00Z', votes: 5, userVote: 0, replies: [
      { id: 'pc10r1', postId: 'poll4', author: contributors[0], body: 'Nemo enim ipsam voluptatem. Raw hemp has such a unique aesthetic — very wabi-sabi.', createdAt: '2024-12-13T15:00:00Z', votes: 3, userVote: 0, replies: [], payout: 0.14 },
    ], payout: 0.38 },
    { id: 'pc11', postId: 'poll4', author: contributors[3], body: 'Neque porro quisquam est qui dolorem. Hemp-Tencel is the future — studies show it\'s gentler on sensitive skin.', createdAt: '2024-12-14T07:00:00Z', votes: 8, userVote: 0, replies: [], payout: 0.52 },
  ],
  poll5: [
    { id: 'pc12', postId: 'poll5', author: contributors[0], body: 'Lorem ipsum dolor sit amet. Myrcene is the backbone of so many great strains — that earthy funk is unmistakable.', createdAt: '2024-12-06T08:00:00Z', votes: 11, userVote: 0, replies: [
      { id: 'pc12r1', postId: 'poll5', author: contentCreators[1], body: 'Absolutely! Sed do eiusmod tempor. Myrcene synergizes beautifully with THC for enhanced relaxation.', createdAt: '2024-12-06T09:00:00Z', votes: 8, userVote: 0, replies: [
        { id: 'pc12r1a', postId: 'poll5', author: contributors[3], body: 'Ut enim ad minim veniam. Pharmacologically, myrcene increases BBB permeability which is fascinating.', createdAt: '2024-12-06T10:30:00Z', votes: 12, userVote: 0, replies: [
          { id: 'pc12r1a1', postId: 'poll5', author: contentCreators[0], body: 'Duis aute irure dolor. Can you write an article about that? Terpene synergy deserves more attention.', createdAt: '2024-12-06T11:00:00Z', votes: 6, userVote: 0, replies: [], payout: 0.35 },
        ], payout: 0.72 },
      ], payout: 0.55 },
    ], payout: 0.88 },
    { id: 'pc13', postId: 'poll5', author: contributors[2], body: 'Excepteur sint occaecat cupidatat. Limonene all day — that citrus burst just puts me in a good mood instantly.', createdAt: '2024-12-06T14:00:00Z', votes: 6, userVote: 0, replies: [
      { id: 'pc13r1', postId: 'poll5', author: contributors[1], body: 'Nemo enim ipsam voluptatem. Limonene-dominant strains are great for daytime use and social settings.', createdAt: '2024-12-06T15:30:00Z', votes: 4, userVote: 0, replies: [], payout: 0.22 },
    ], payout: 0.41 },
    { id: 'pc14', postId: 'poll5', author: contentCreators[3], body: 'Quis autem vel eum iure reprehenderit. Linalool is the most underrated — that lavender note is so soothing.', createdAt: '2024-12-07T10:00:00Z', votes: 7, userVote: 0, replies: [], payout: 0.48 },
  ],
  poll6: [
    { id: 'pc15', postId: 'poll6', author: contentCreators[0], body: 'Lorem ipsum dolor sit amet. Cannabis & mental health needs the most nuanced coverage — so much misinformation.', createdAt: '2024-12-02T08:00:00Z', votes: 15, userVote: 0, replies: [
      { id: 'pc15r1', postId: 'poll6', author: contributors[3], body: 'Sed do eiusmod tempor. As a medical researcher, I\'d love to contribute data and case studies.', createdAt: '2024-12-02T09:00:00Z', votes: 11, userVote: 0, replies: [
        { id: 'pc15r1a', postId: 'poll6', author: contributors[1], body: 'Ut enim ad minim veniam. That would be incredible! We need more evidence-based content.', createdAt: '2024-12-02T10:00:00Z', votes: 8, userVote: 0, replies: [
          { id: 'pc15r1a1', postId: 'poll6', author: contentCreators[1], body: 'Consectetur adipiscing elit. Count me in — I can cover the terpene-anxiety connection angle.', createdAt: '2024-12-02T11:30:00Z', votes: 5, userVote: 0, replies: [], payout: 0.25 },
        ], payout: 0.42 },
      ], payout: 0.68 },
    ], payout: 1.25 },
    { id: 'pc16', postId: 'poll6', author: contributors[2], body: 'Duis aute irure dolor in reprehenderit. Global legalization would be my pick — so much happening worldwide.', createdAt: '2024-12-02T14:00:00Z', votes: 9, userVote: 0, replies: [
      { id: 'pc16r1', postId: 'poll6', author: contentCreators[3], body: 'Excepteur sint occaecat. I could contribute illustrations mapping the global legalization timeline!', createdAt: '2024-12-02T16:00:00Z', votes: 7, userVote: 0, replies: [], payout: 0.35 },
    ], payout: 0.58 },
    { id: 'pc17', postId: 'poll6', author: contentCreators[2], body: 'Neque porro quisquam est. Sustainable growing is important — indoor grows\' environmental impact is rarely discussed.', createdAt: '2024-12-03T09:00:00Z', votes: 6, userVote: 0, replies: [], payout: 0.44 },
  ],
  poll7: [
    { id: 'pc18', postId: 'poll7', author: contributors[0], body: 'Lorem ipsum dolor sit amet. Important poll — normalizing open conversations about frequency helps reduce stigma.', createdAt: '2024-11-16T08:00:00Z', votes: 10, userVote: 0, replies: [
      { id: 'pc18r1', postId: 'poll7', author: contributors[3], body: 'Ut enim ad minim veniam. Agreed — this data could be useful for harm reduction messaging too.', createdAt: '2024-11-16T09:30:00Z', votes: 7, userVote: 0, replies: [
        { id: 'pc18r1a', postId: 'poll7', author: contentCreators[0], body: 'Sed do eiusmod tempor. Would love to see this compared with alcohol consumption surveys.', createdAt: '2024-11-16T11:00:00Z', votes: 5, userVote: 0, replies: [], payout: 0.18 },
      ], payout: 0.38 },
    ], payout: 0.65 },
    { id: 'pc19', postId: 'poll7', author: contentCreators[1], body: 'Duis aute irure dolor. Microdosing daily has been transformative for my focus and anxiety management.', createdAt: '2024-11-17T10:00:00Z', votes: 8, userVote: 0, replies: [
      { id: 'pc19r1', postId: 'poll7', author: contributors[2], body: 'Nemo enim ipsam voluptatem. What dosage works best for you? I\'m still dialing in my routine.', createdAt: '2024-11-17T12:00:00Z', votes: 5, userVote: 0, replies: [
        { id: 'pc19r1a', postId: 'poll7', author: contentCreators[1], body: 'Lorem ipsum dolor sit amet. Around 2.5mg THC with equal CBD — just enough without impairing.', createdAt: '2024-11-17T13:30:00Z', votes: 9, userVote: 0, replies: [], payout: 0.45 },
      ], payout: 0.28 },
    ], payout: 0.48 },
  ],
  poll8: [
    { id: 'pc20', postId: 'poll8', author: contentCreators[0], body: 'Lorem ipsum dolor sit amet. Jack Herer is the GOAT for creative work — named after a legend for a reason.', createdAt: '2024-12-15T08:00:00Z', votes: 13, userVote: 0, replies: [
      { id: 'pc20r1', postId: 'poll8', author: contributors[2], body: 'Sed do eiusmod tempor. I alternate between Jack Herer and Sour Diesel depending on the creative task.', createdAt: '2024-12-15T09:00:00Z', votes: 8, userVote: 0, replies: [
        { id: 'pc20r1a', postId: 'poll8', author: contentCreators[3], body: 'Ut enim ad minim veniam. For visual art I prefer Blue Dream — it puts me in a dreamy flow state.', createdAt: '2024-12-15T10:30:00Z', votes: 6, userVote: 0, replies: [
          { id: 'pc20r1a1', postId: 'poll8', author: contributors[1], body: 'Duis aute irure dolor. Blue Dream is perfect for illustration — the colors just seem more vivid!', createdAt: '2024-12-15T11:15:00Z', votes: 4, userVote: 0, replies: [], payout: 0.18 },
        ], payout: 0.32 },
      ], payout: 0.45 },
    ], payout: 0.92 },
    { id: 'pc21', postId: 'poll8', author: contributors[1], body: 'Excepteur sint occaecat cupidatat. Durban Poison is underrated — pure sativa energy without the anxiety.', createdAt: '2024-12-15T14:00:00Z', votes: 7, userVote: 0, replies: [
      { id: 'pc21r1', postId: 'poll8', author: contributors[3], body: 'Nemo enim ipsam voluptatem. The THCV content in Durban Poison gives unique, clear-headed stimulation.', createdAt: '2024-12-15T15:30:00Z', votes: 9, userVote: 0, replies: [
        { id: 'pc21r1a', postId: 'poll8', author: contentCreators[1], body: 'Lorem ipsum dolor sit amet. THCV is such an interesting cannabinoid — we should do a deep dive!', createdAt: '2024-12-15T16:45:00Z', votes: 5, userVote: 0, replies: [], payout: 0.22 },
      ], payout: 0.55 },
    ], payout: 0.48 },
    { id: 'pc22', postId: 'poll8', author: contentCreators[2], body: 'Neque porro quisquam est qui dolorem. Microdosing any sativa-dominant strain works best for cooking creativity.', createdAt: '2024-12-16T08:00:00Z', votes: 5, userVote: 0, replies: [
      { id: 'pc22r1', postId: 'poll8', author: contributors[0], body: 'Quis autem vel eum iure. Have you tried Green Crack for cooking? The focus it provides is incredible.', createdAt: '2024-12-16T09:30:00Z', votes: 3, userVote: 0, replies: [], payout: 0.15 },
    ], payout: 0.35 },
  ],
};

// Mutable state for optimistic updates
let postsState = [...posts];
let commentsState = { ...comments, ...pollComments };
let notificationsState = [...notifications];
let forumsState = [...forumThreads];
let pollsState = [...pollsData];

export const mockApi: ApiService = {
  async getPosts(tag?: string, _sort?: string) {
    await delay();
    let result = [...postsState];
    if (tag) result = result.filter(p => p.tags.includes(tag));
    return result;
  },

  async getPostById(id: string) {
    await delay();
    const post = postsState.find(p => p.id === id);
    if (!post) throw new Error('Post not found');
    return { ...post };
  },

  async createPost(data: Partial<Post>) {
    await delay();
    const newPost: Post = {
      id: `p${Date.now()}`, title: data.title || '', body: data.body || '',
      excerpt: (data.body || '').replace(/<[^>]*>/g, '').slice(0, 150) + '...',
      coverImage: data.coverImage || '', author: users[0],
      tags: data.tags || [], createdAt: new Date().toISOString(),
      readingTime: Math.ceil((data.body || '').split(' ').length / 200),
      votes: 0, userVote: 0, commentCount: 0, bookmarked: false, payout: 0,
    };
    postsState = [newPost, ...postsState];
    return newPost;
  },

  async votePost(postId: string, weight: number) {
    await delay();
    postsState = postsState.map(p => p.id === postId ? { ...p, votes: p.votes + weight, userVote: weight } : p);
  },

  async getComments(postId: string) {
    await delay();
    return commentsState[postId] || [];
  },

  async addComment(postId: string, body: string, _parentId?: string) {
    await delay();
    const newComment: Comment = {
      id: `c${Date.now()}`, postId, author: users[0], body,
      createdAt: new Date().toISOString(), votes: 0, userVote: 0, replies: [], payout: 0,
    };
    commentsState[postId] = [...(commentsState[postId] || []), newComment];
    return newComment;
  },

  async getUser(username: string) {
    await delay();
    const user = users.find(u => u.username === username);
    if (user) return { ...user };
    
    // Return default user with blockchain-like data for unknown usernames
    return {
      id: username,
      username,
      displayName: username,
      avatar: `https://steemitimages.com/u/${username}/avatar`,
      bio: '',
      followers: 0,
      following: 0,
      postCount: 0,
      joinedDate: new Date().toISOString(),
      reputation: 50,
      steemPower: 0,
      steemBalance: 0,
      sbdBalance: 0,
      balance: '0.000 STEEM',
      savingsBalance: '0.000 STEEM',
      sbdBalanceStr: '0.000 SBD',
      savingsSbdBalance: '0.000 SBD',
      vestingShares: '0.000000 VESTS',
      delegatedVestingShares: '0.000000 VESTS',
      receivedVestingShares: '0.000000 VESTS',
      rewardVestingBalance: '0.000000 VESTS',
      rewardVestingSteem: '0.000 STEEM',
      vestingBalance: '0.000 STEEM',
    };
  },

  async getUserPosts(username: string) {
    await delay();
    return postsState.filter(p => p.author.username === username);
  },

  async getTags() {
    await delay();
    return [...tags];
  },

  async getNotifications() {
    await delay();
    return [...notificationsState];
  },

  async getWalletHistory() {
    await delay();
    return [...walletHistory];
  },

  async getCommunity() {
    await delay();
    return { ...community };
  },

  async getCommunityMembers() {
    await delay();
    return [...contributors];
  },

  async getTopContentCreators() {
    await delay();
    return [...contentCreators];
  },

  async toggleBookmark(postId: string) {
    await delay();
    postsState = postsState.map(p => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p);
  },

  async followUser(_username: string) {
    await delay();
  },

  async getForumThreads() {
    await delay();
    return [...forumsState];
  },

  async getForumThread(id: string) {
    await delay();
    const thread = forumsState.find(t => t.id === id);
    if (!thread) throw new Error('Thread not found');
    return { ...thread };
  },

  async createForumThread(data: Partial<ForumThread>) {
    await delay();
    const thread: ForumThread = {
      id: `ft${Date.now()}`, title: data.title || '', body: data.body || '',
      author: contributors[0], createdAt: new Date().toISOString(),
      replyCount: 0, lastReplyAt: new Date().toISOString(),
      pinned: false, tags: data.tags || [], votes: 0,
    };
    forumsState = [thread, ...forumsState];
    return thread;
  },

  async getForumReplies(threadId: string) {
    await delay();
    return forumReplies[threadId] || [];
  },

  async addForumReply(threadId: string, body: string, _parentId?: string) {
    await delay();
    const reply: ForumReply = {
      id: `fr${Date.now()}`, threadId, author: users[0], body: `<p>${body}</p>`,
      createdAt: new Date().toISOString(), votes: 0, userVote: 0, replies: [],
    };
    forumReplies[threadId] = [...(forumReplies[threadId] || []), reply];
    // update reply count
    forumsState = forumsState.map(t => t.id === threadId ? { ...t, replyCount: t.replyCount + 1 } : t);
    return reply;
  },

  async getPolls() {
    await delay();
    return [...pollsState];
  },

  async getPoll(id: string) {
    await delay();
    const poll = pollsState.find(p => p.id === id);
    if (!poll) throw new Error('Poll not found');
    return { ...poll };
  },

  async createPoll(data: { title: string; description: string; options: string[]; endsAt: string; tags?: string[] }) {
    await delay();
    const poll: Poll = {
      id: `poll${Date.now()}`, title: data.title, description: data.description,
      author: contributors[0], createdAt: new Date().toISOString(), endsAt: data.endsAt,
      options: data.options.map((label, i) => ({ id: `po${Date.now()}_${i}`, label, votes: 0 })),
      totalVotes: 0, closed: false, payout: 0, commentCount: 0, votes: 0, userVote: 0, tags: data.tags || [],
    };
    pollsState = [poll, ...pollsState];
    return poll;
  },

  async votePoll(pollId: string, optionId: string) {
    await delay();
    pollsState = pollsState.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        userVotedOptionId: optionId,
        totalVotes: p.totalVotes + 1,
        options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
      };
    });
    const poll = pollsState.find(p => p.id === pollId);
    if (!poll) throw new Error('Poll not found');
    return { ...poll };
  },
};
