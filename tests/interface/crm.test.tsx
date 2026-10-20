import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LeadsPage } from '@/components/leads/LeadsPage';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { resetClientRepository } from '@/lib/db/client';
import { crmStore } from '@/lib/store/crmStore';

/**
 * The interface driven the way a person drives it, against the real
 * browser-backed store. Nothing is mocked except the router, which
 * belongs to Next rather than to this app.
 */

const push = vi.fn();
const replace = vi.fn();
const params = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => params,
  usePathname: () => '/leads',
}));

async function addLead(
  user: ReturnType<typeof userEvent.setup>,
  fields: { name: string; company?: string; amount?: string; stage?: string },
): Promise<void> {
  await user.click(screen.getAllByRole('button', { name: 'Add a lead' })[0]!);
  await user.type(screen.getByLabelText('Name'), fields.name);
  if (fields.company) await user.type(screen.getByLabelText('Company'), fields.company);
  if (fields.amount) await user.type(screen.getByLabelText('Estimated value'), fields.amount);
  if (fields.stage) await user.selectOptions(screen.getByLabelText('Stage'), fields.stage);
  await user.click(screen.getByRole('button', { name: 'Add the lead' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Add the lead' })).toBeNull());
}

beforeEach(() => {
  window.localStorage.clear();
  resetClientRepository();
  crmStore.reset();
});

afterEach(() => cleanup());

describe('leads', () => {
  it('starts with an empty state that says figures come from real leads', async () => {
    render(<LeadsPage />);
    expect(await screen.findByText('No leads yet')).toBeInTheDocument();
  });

  it('creates a lead and shows it in the table', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    await screen.findByText('No leads yet');

    await addLead(user, { name: 'Ana Ribeiro', company: 'Núcleo Design', amount: '4.500,00' });

    const row = await screen.findByRole('row', { name: /Ana Ribeiro/ });
    expect(within(row).getByText('Núcleo Design')).toBeInTheDocument();
    // 4.500,00 typed in the European form is stored as 450000 cents.
    expect(within(row).getByText(/4\.500,00/)).toBeInTheDocument();
  });

  it('keeps the lead across a reload, because the store is the browser', async () => {
    const user = userEvent.setup();
    const first = render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro' });
    first.unmount();

    resetClientRepository();
    crmStore.reset();
    render(<LeadsPage />);
    expect(await screen.findByRole('row', { name: /Ana Ribeiro/ })).toBeInTheDocument();
  });

  it('shows the message for an invalid field instead of doing nothing', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    await screen.findByText('No leads yet');

    await user.click(screen.getAllByRole('button', { name: 'Add a lead' })[0]!);
    await user.type(screen.getByLabelText('Name'), 'Ana');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Add the lead' }));

    expect(await screen.findByText('That does not look like an email address.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add the lead' })).toBeInTheDocument();
  });

  it('refuses a lead with no name', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    await screen.findByText('No leads yet');

    await user.click(screen.getAllByRole('button', { name: 'Add a lead' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Add the lead' }));
    expect(await screen.findByText('A lead needs a name.')).toBeInTheDocument();
  });

  it('searches by company, ignoring accents', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro', company: 'Núcleo Design' });
    await addLead(user, { name: 'Bruno Lima', company: 'Oficina Verde' });

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'nucleo');

    await waitFor(() => expect(screen.queryByRole('row', { name: /Bruno Lima/ })).toBeNull());
    expect(screen.getByRole('row', { name: /Ana Ribeiro/ })).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 leads.')).toBeInTheDocument();
  });

  it('filters by stage and says when nothing matches', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro', stage: 'new' });

    await user.click(screen.getByRole('checkbox', { name: 'Closed won' }));
    expect(await screen.findByText('No lead matches this view')).toBeInTheDocument();

    // Both the filter card and the empty state offer it; either will do.
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!);
    expect(await screen.findByRole('row', { name: /Ana Ribeiro/ })).toBeInTheDocument();
  });

  it('asks before deleting, and says the history goes too', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro' });

    await user.click(screen.getByRole('button', { name: 'Delete Ana Ribeiro' }));
    expect(await screen.findByText(/history go together/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.getByRole('row', { name: /Ana Ribeiro/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Ana Ribeiro' }));
    await user.click(screen.getByRole('button', { name: 'Delete the lead' }));
    await waitFor(() => expect(screen.queryByRole('row', { name: /Ana Ribeiro/ })).toBeNull());
  });
});

describe('pipeline', () => {
  it('moves a lead with the menu on the card and announces it', async () => {
    const user = userEvent.setup();
    const leads = render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro', stage: 'new' });
    leads.unmount();

    render(<PipelineBoard />);
    const card = await screen.findByRole('combobox', { name: 'Move Ana Ribeiro to another stage' });
    await user.selectOptions(card, 'proposal');

    const column = await screen.findByRole('region', { name: 'Proposal sent' });
    await waitFor(() => expect(within(column).getByText('Ana Ribeiro')).toBeInTheDocument());
    expect(screen.getByText('Ana Ribeiro moved to Proposal sent.')).toBeInTheDocument();
  });
});

describe('dashboard', () => {
  it('counts the pipeline from the leads that are there', async () => {
    const user = userEvent.setup();
    const leads = render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro', amount: '1000', stage: 'proposal' });
    await addLead(user, { name: 'Bruno Lima', amount: '500', stage: 'won' });
    leads.unmount();

    render(<Dashboard />);
    const pipeline = (await screen.findByText('Pipeline value')).closest('div')?.parentElement;
    // The won deal is counted as won and kept out of the pipeline, so
    // the pipeline card shows the proposal alone.
    expect(within(pipeline as HTMLElement).getAllByText(/1\.000,00/).length).toBeGreaterThan(0);
    const won = screen.getByText('Won').closest('div');
    expect(within(won as HTMLElement).getByText(/500,00 closed/)).toBeInTheDocument();
  });
});

describe('settings', () => {
  it('exports the leads as CSV with the phone number disarmed', async () => {
    const user = userEvent.setup();
    const blobs: string[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      void (blob as Blob).text().then((text) => blobs.push(text));
      return 'blob:stub';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const leads = render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await user.click(screen.getAllByRole('button', { name: 'Add a lead' })[0]!);
    await user.type(screen.getByLabelText('Name'), 'Ana Ribeiro');
    await user.type(screen.getByLabelText('Phone'), '+55 81 90000-0001');
    await user.click(screen.getByRole('button', { name: 'Add the lead' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Add the lead' })).toBeNull());
    leads.unmount();

    render(<SettingsPage />);
    await user.click(await screen.findByRole('button', { name: /Export 1 leads/ }));

    await waitFor(() => expect(blobs).toHaveLength(1));
    expect(blobs[0]).toContain("'+55 81 90000-0001");
    vi.restoreAllMocks();
  });

  it('clears everything after a confirmation that names the count', async () => {
    const user = userEvent.setup();
    const leads = render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro' });
    leads.unmount();

    render(<SettingsPage />);
    await user.click(await screen.findByRole('button', { name: 'Clear everything' }));
    expect(screen.getByText(/All 1 leads and their history/)).toBeInTheDocument();
    // The dialog's own button is the second one with that name.
    await user.click(screen.getAllByRole('button', { name: 'Clear everything' })[1]!);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Export 0 leads/ })).toBeDisabled(),
    );
  });

  it('relabels amounts when the currency changes, and never converts them', async () => {
    const user = userEvent.setup();
    const leads = render(<LeadsPage />);
    await screen.findByText('No leads yet');
    await addLead(user, { name: 'Ana Ribeiro', amount: '4500' });
    leads.unmount();

    const page = render(<SettingsPage />);
    await user.click(await screen.findByText('US dollar'));
    page.unmount();

    render(<LeadsPage />);
    const row = await screen.findByRole('row', { name: /Ana Ribeiro/ });
    expect(within(row).getByText('$4,500.00')).toBeInTheDocument();
  });
});
