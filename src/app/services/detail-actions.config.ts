import { DetailAction, DetailActionArea, DetailActionSection, DetailActionUserType } from '@congarevenuecloud/ecommerce';

// Only authenticated users.
const LOGGED_IN_ONLY = [DetailActionUserType.LoggedIn];

// Collaboration actions are reachable from a shared DSR link, so guests get them alongside
// authenticated users.
const ALL_USERS = [DetailActionUserType.LoggedIn, DetailActionUserType.Guest];

// Built-in action configuration for the digital sales room detail page sections, used when the
// storefront displayActions API returns no override. A quote in the Generated stage behaves
// differently depending on collaboration: without an active request the seller is still authoring
// the quote, so Generate and Present lead; with one the buyer is reviewing, so Accept and Reject
// lead instead. Once Presented, Accept and Reject always lead and the authoring actions move into
// the kebab menu. Each variant is configured as its own record because they differ in placement,
// audience and collaboration state, which also lets a storefront re-target one variant on its own.
// ActionArea places each action in the header (Main) or the kebab menu; Sequence orders within an area.
export const DEFAULT_DETAIL_ACTIONS: Array<DetailAction> = [
  // ---------------------------------------------------------------------------------------------
  // Quote detail - buyer actions while a collaboration request is in flight
  // ---------------------------------------------------------------------------------------------
  {
    Name: 'Reject',
    Section: DetailActionSection.Quote,
    Sequence: 1,
    IsEnabled: true,
    ActionName: 'Reject',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: false,
    ActionLabelName: 'COMMON.REJECT',
    IsPrimaryAction: false,
    Stage: ['Generated'],
    UserType: ALL_USERS,
    RequiresCollaboration: true
  },
  {
    Name: 'AcceptQuote',
    Section: DetailActionSection.Quote,
    Sequence: 2,
    IsEnabled: true,
    ActionName: 'AcceptQuote',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: false,
    ActionLabelName: 'COMMON.ACCEPT_QUOTE',
    IsPrimaryAction: true,
    Stage: ['Generated'],
    UserType: ALL_USERS,
    RequiresCollaboration: true
  },
  {
    Name: 'RequestChanges',
    Section: DetailActionSection.Quote,
    Sequence: 3,
    IsEnabled: true,
    ActionName: 'RequestChanges',
    ActionArea: DetailActionArea.Kebab,
    AlwaysDisplay: false,
    ActionLabelName: 'COMMENTS.REQUEST_CHANGES',
    IsPrimaryAction: false,
    Stage: ['Generated'],
    UserType: ALL_USERS,
    RequiresCollaboration: true
  },

  // ---------------------------------------------------------------------------------------------
  // Quote detail - buyer actions once the quote has been presented
  // ---------------------------------------------------------------------------------------------
  {
    Name: 'RejectPresented',
    Section: DetailActionSection.Quote,
    Sequence: 1,
    IsEnabled: true,
    ActionName: 'Reject',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: false,
    ActionLabelName: 'COMMON.REJECT',
    IsPrimaryAction: false,
    Stage: ['Presented'],
    UserType: ALL_USERS
  },
  {
    Name: 'AcceptQuotePresented',
    Section: DetailActionSection.Quote,
    Sequence: 2,
    IsEnabled: true,
    ActionName: 'AcceptQuote',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: false,
    ActionLabelName: 'COMMON.ACCEPT_QUOTE',
    IsPrimaryAction: true,
    Stage: ['Presented'],
    UserType: ALL_USERS
  },
  {
    Name: 'RequestChangesPresented',
    Section: DetailActionSection.Quote,
    Sequence: 3,
    IsEnabled: true,
    ActionName: 'RequestChanges',
    ActionArea: DetailActionArea.Kebab,
    AlwaysDisplay: false,
    ActionLabelName: 'COMMENTS.REQUEST_CHANGES',
    IsPrimaryAction: false,
    Stage: ['Presented'],
    UserType: ALL_USERS
  },

  // ---------------------------------------------------------------------------------------------
  // Quote detail - seller authoring actions, only while no collaboration request is in flight
  // ---------------------------------------------------------------------------------------------
  {
    Name: 'Generate',
    Section: DetailActionSection.Quote,
    Sequence: 4,
    IsEnabled: true,
    ActionName: 'Generate',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: false,
    ActionLabelName: 'DETAILS.GENERATE_QUOTE',
    IsPrimaryAction: false,
    Stage: ['Draft', 'Generated'],
    UserType: LOGGED_IN_ONLY,
    RequiresCollaboration: false
  },
  {
    Name: 'Present',
    Section: DetailActionSection.Quote,
    Sequence: 5,
    IsEnabled: true,
    ActionName: 'Present',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: false,
    ActionLabelName: 'DETAILS.PRESENT_QUOTE',
    IsPrimaryAction: true,
    Stage: ['Generated'],
    UserType: LOGGED_IN_ONLY,
    RequiresCollaboration: false
  },
  {
    Name: 'GeneratePresented',
    Section: DetailActionSection.Quote,
    Sequence: 4,
    IsEnabled: true,
    ActionName: 'Generate',
    ActionArea: DetailActionArea.Kebab,
    AlwaysDisplay: false,
    ActionLabelName: 'DETAILS.GENERATE_QUOTE',
    IsPrimaryAction: false,
    Stage: ['Presented'],
    UserType: LOGGED_IN_ONLY,
    RequiresCollaboration: false
  },
  {
    Name: 'PresentPresented',
    Section: DetailActionSection.Quote,
    Sequence: 5,
    IsEnabled: true,
    ActionName: 'Present',
    ActionArea: DetailActionArea.Kebab,
    AlwaysDisplay: false,
    ActionLabelName: 'DETAILS.PRESENT_QUOTE',
    IsPrimaryAction: false,
    Stage: ['Presented'],
    UserType: LOGGED_IN_ONLY,
    RequiresCollaboration: false
  },

  // ---------------------------------------------------------------------------------------------
  // Cart detail
  // ---------------------------------------------------------------------------------------------
  {
    Name: 'RequestQuote',
    Section: DetailActionSection.Cart,
    Sequence: 1,
    IsEnabled: true,
    ActionName: 'RequestQuote',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: true,
    ActionLabelName: 'COMMON.REQUEST_QUOTE',
    IsPrimaryAction: false,
    Stage: [],
    UserType: ALL_USERS
  },
  {
    Name: 'BeginCheckout',
    Section: DetailActionSection.Cart,
    Sequence: 2,
    IsEnabled: true,
    ActionName: 'BeginCheckout',
    ActionArea: DetailActionArea.Main,
    AlwaysDisplay: true,
    ActionLabelName: 'COMMON.BEGIN_CHECKOUT',
    IsPrimaryAction: true,
    Stage: [],
    UserType: ALL_USERS
  }
];
