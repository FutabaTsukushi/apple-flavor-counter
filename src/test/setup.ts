import { config } from '@vue/test-utils';
import { vi } from 'vitest';

config.global.stubs = {};

vi.stubGlobal('IntersectionObserver', vi.fn());
