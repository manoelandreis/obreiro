import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Tokens',
};
export default meta;

type Story = StoryObj;

const colorGroups: { group: string; tokens: string[] }[] = [
  { group: 'Base', tokens: ['background', 'foreground', 'card', 'muted', 'border', 'input'] },
  { group: 'Marca', tokens: ['primary', 'accent', 'accent-soft', 'brand-dark', 'navy-deep'] },
  { group: 'Estado', tokens: ['success', 'warning', 'info', 'destructive'] },
  { group: 'Barra lateral', tokens: ['sidebar-background', 'sidebar-accent', 'sidebar-primary'] },
];

export const Cores: Story = {
  render: () => (
    <div className="space-y-8">
      {colorGroups.map(({ group, tokens }) => (
        <section key={group}>
          <h3 className="font-heading text-lg font-semibold mb-3">{group}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tokens.map((token) => (
              <div key={token} className="rounded-lg border border-border overflow-hidden">
                <div className="h-16" style={{ backgroundColor: `hsl(var(--${token}))` }} />
                <div className="p-2 text-xs">
                  <div className="font-medium">--{token}</div>
                  <div className="text-muted-foreground">bg-{token}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Tipografia: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Títulos: Poppins · Texto: Inter</p>
      <h1 className="font-heading text-4xl font-bold">Título H1 / Poppins Bold</h1>
      <h2 className="font-heading text-3xl font-semibold">Título H2 / Poppins SemiBold</h2>
      <h3 className="font-heading text-2xl font-semibold">Título H3</h3>
      <p className="text-base">Corpo de texto em Inter Regular, usado nas páginas da app.</p>
      <p className="text-sm text-muted-foreground">Texto secundário / muted-foreground.</p>
    </div>
  ),
};

export const Raios: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      {['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full'].map((r) => (
        <div key={r} className="text-center text-xs">
          <div className={`h-20 w-20 bg-primary ${r}`} />
          <div className="mt-2">{r}</div>
        </div>
      ))}
    </div>
  ),
};

export const Sombras: Story = {
  render: () => (
    <div className="flex gap-6 flex-wrap">
      {['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-accent'].map((s) => (
        <div key={s} className="text-center text-xs">
          <div className="h-20 w-32 rounded-lg bg-card" style={{ boxShadow: `var(${s})` }} />
          <div className="mt-2">{s}</div>
        </div>
      ))}
    </div>
  ),
};
