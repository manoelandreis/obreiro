import React from 'react';
import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../src/components/ui/tooltip';
import '../src/index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
    viewport: {
      viewports: {
        mobile: { name: 'Telemóvel (390px)', styles: { width: '390px', height: '844px' } },
        tablet: { name: 'Tablet (768px)', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Computador (1280px)', styles: { width: '1280px', height: '900px' } },
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: { Claro: '', Escuro: 'dark' },
      defaultTheme: 'Claro',
    }),
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TooltipProvider>
            <div className="bg-background text-foreground p-6 min-h-[200px]">
              <Story />
            </div>
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
