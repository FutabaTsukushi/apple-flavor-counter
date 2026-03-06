import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MotionCounter from '../MotionCounter.vue';

vi.mock('gsap', () => ({
  default: {
    killTweensOf: vi.fn(),
    set: vi.fn(),
    to: vi.fn((_el, props) => {
      if (props.onComplete) {
        setTimeout(props.onComplete, 0);
      }
      return {
        kill: vi.fn()
      };
    })
  }
}));

import gsap from 'gsap';

describe('MotionCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial value correctly', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 123 }
    });
    await nextTick();
    await nextTick();

    const slots = wrapper.findAll('.digit-slot');
    expect(slots.length).toBe(3);
    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(1);
    expect((wrapper.vm as any).digitColumns[1].currentValue).toBe(2);
    expect((wrapper.vm as any).digitColumns[2].currentValue).toBe(3);
  });

  it('renders single digit correctly', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 5 }
    });
    await nextTick();
    await nextTick();

    const slots = wrapper.findAll('.digit-slot');
    expect(slots.length).toBe(1);
    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(5);
  });

  it('renders zero correctly', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 0 }
    });
    await nextTick();
    await nextTick();

    const slots = wrapper.findAll('.digit-slot');
    expect(slots.length).toBe(1);
    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(0);
  });

  it('applies custom size prop', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 42, size: 72 }
    });
    await nextTick();

    const container = wrapper.find('.motion-counter');
    expect(container.attributes('style')).toContain('font-size: 72px');
  });

  it('applies custom color prop', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 42, color: '#ff0000' }
    });
    await nextTick();

    const container = wrapper.find('.motion-counter');
    expect(container.attributes('style')).toMatch(
      /color:\s*(rgb\(255,\s*0,\s*0\)|#ff0000)/i
    );
  });

  it('applies default size and color', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 42 }
    });
    await nextTick();

    const container = wrapper.find('.motion-counter');
    expect(container.attributes('style')).toContain('font-size: 48px');
    expect(container.attributes('style')).toContain('color: inherit');
  });

  it('debounces value updates by default (300ms)', async () => {
    vi.useRealTimers();
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 100, stepDuration: 10 }
    });
    await nextTick();
    await nextTick();

    expect(wrapper.findAll('.digit-slot').length).toBe(3);
    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(1);

    await wrapper.setProps({ modelValue: 200 });
    await new Promise(resolve => setTimeout(resolve, 100));
    await nextTick();

    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(1);

    await new Promise(resolve => setTimeout(resolve, 300));
    await vi.waitFor(
      () => {
        expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(2);
      },
      { timeout: 500 }
    );

    vi.useFakeTimers();
  });

  it('respects custom debounce time', async () => {
    vi.useRealTimers();
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 100, debounce: 500, stepDuration: 10 }
    });
    await nextTick();
    await nextTick();

    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(1);

    await wrapper.setProps({ modelValue: 200 });
    await new Promise(resolve => setTimeout(resolve, 300));
    await nextTick();

    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(1);

    await new Promise(resolve => setTimeout(resolve, 300));
    await vi.waitFor(
      () => {
        expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(2);
      },
      { timeout: 500 }
    );

    vi.useFakeTimers();
  });

  it('updates immediately when debounce is 0', async () => {
    vi.useRealTimers();
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 100, debounce: 0, stepDuration: 10 }
    });
    await nextTick();
    await nextTick();

    expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(1);

    await wrapper.setProps({ modelValue: 200 });
    await vi.waitFor(
      () => {
        expect((wrapper.vm as any).digitColumns[0].currentValue).toBe(2);
      },
      { timeout: 500 }
    );

    vi.useFakeTimers();
  });

  it('handles value increase correctly', async () => {
    vi.useRealTimers();
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 5, debounce: 0, stepDuration: 10 }
    });
    await nextTick();
    await nextTick();

    await wrapper.setProps({ modelValue: 9 });
    await vi.waitFor(() => expect(gsap.to).toHaveBeenCalled(), {
      timeout: 500
    });

    wrapper.unmount();
  });

  it('handles value decrease correctly', async () => {
    vi.useRealTimers();
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 9, debounce: 0, stepDuration: 10 }
    });
    await nextTick();
    await nextTick();

    await wrapper.setProps({ modelValue: 5 });
    await vi.waitFor(() => expect(gsap.to).toHaveBeenCalled(), {
      timeout: 500
    });

    wrapper.unmount();
  });

  it('handles digit count increase', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 99, debounce: 0 }
    });
    await nextTick();
    await nextTick();

    expect(wrapper.findAll('.digit-slot').length).toBe(2);

    await wrapper.setProps({ modelValue: 100 });
    await nextTick();
    await nextTick();

    expect(wrapper.findAll('.digit-slot').length).toBe(3);
  });

  it('handles digit count decrease', async () => {
    vi.useRealTimers();

    const wrapper = mount(MotionCounter, {
      props: { modelValue: 100, debounce: 0, stepDuration: 10 }
    });
    await nextTick();
    await nextTick();

    expect(wrapper.findAll('.digit-slot').length).toBe(3);

    await wrapper.setProps({ modelValue: 99 });
    
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await vi.waitFor(
      () => {
        const slots = wrapper.findAll('.digit-slot');
        expect(slots.length).toBe(2);
      },
      { timeout: 1000 }
    );

    vi.useFakeTimers();
  });

  it('does not animate when value unchanged', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 42, debounce: 0 }
    });
    await nextTick();
    await nextTick();

    vi.clearAllMocks();

    await wrapper.setProps({ modelValue: 42 });
    await nextTick();

    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('uses default increasingDirection as up', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 5, debounce: 0 }
    });
    await nextTick();

    expect(wrapper.props('increasingDirection')).toBe('up');
  });

  it('accepts increasingDirection down', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 5, debounce: 0, increasingDirection: 'down' }
    });
    await nextTick();

    expect(wrapper.props('increasingDirection')).toBe('down');
  });

  it('accepts custom stepDuration', async () => {
    const wrapper = mount(MotionCounter, {
      props: { modelValue: 5, stepDuration: 100 }
    });
    await nextTick();

    expect(wrapper.props('stepDuration')).toBe(100);
  });
});
