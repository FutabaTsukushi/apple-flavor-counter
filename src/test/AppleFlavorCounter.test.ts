import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppleFlavorCounter from '../AppleFlavorCounter.vue'

vi.mock('gsap', () => ({
  default: {
    killTweensOf: vi.fn(),
    fromTo: vi.fn((_el, _from, to) => {
      if (to.onComplete) {
        setTimeout(to.onComplete, 0)
      }
    })
  }
}))

import gsap from 'gsap'

describe('AppleFlavorCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders initial value correctly', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 123 }
    })
    await nextTick()

    const digits = wrapper.findAll('.digit-slot')
    expect(digits.length).toBe(3)
    expect(digits[0].text()).toBe('1')
    expect(digits[1].text()).toBe('2')
    expect(digits[2].text()).toBe('3')
  })

  it('renders single digit correctly', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 5 }
    })
    await nextTick()

    const digits = wrapper.findAll('.digit-slot')
    expect(digits.length).toBe(1)
    expect(digits[0].text()).toBe('5')
  })

  it('renders zero correctly', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 0 }
    })
    await nextTick()

    const digits = wrapper.findAll('.digit-slot')
    expect(digits.length).toBe(1)
    expect(digits[0].text()).toBe('0')
  })

  it('applies custom size prop', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 42, size: 72 }
    })
    await nextTick()

    const container = wrapper.find('.apple-counter')
    expect(container.attributes('style')).toContain('font-size: 72px')
  })

  it('applies custom color prop', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 42, color: '#ff0000' }
    })
    await nextTick()

    const container = wrapper.find('.apple-counter')
    expect(container.attributes('style')).toMatch(
      /color:\s*(rgb\(255,\s*0,\s*0\)|#ff0000)/i
    )
  })

  it('applies default size and color', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 42 }
    })
    await nextTick()

    const container = wrapper.find('.apple-counter')
    expect(container.attributes('style')).toContain('font-size: 48px')
    expect(container.attributes('style')).toContain('color: inherit')
  })

  it('debounces value updates by default (300ms)', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 100 }
    })
    await nextTick()

    expect(wrapper.findAll('.digit-slot').length).toBe(3)

    await wrapper.setProps({ modelValue: 200 })
    vi.advanceTimersByTime(100)

    const digits = wrapper.findAll('.digit-slot')
    expect(digits[0].text()).toBe('1')

    vi.advanceTimersByTime(200)
    await nextTick()

    const updatedDigits = wrapper.findAll('.digit-slot .new')
    expect(updatedDigits[0].text()).toBe('2')
  })

  it('respects custom debounce time', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 100, debounce: 500 }
    })
    await nextTick()

    await wrapper.setProps({ modelValue: 200 })
    vi.advanceTimersByTime(300)
    await nextTick()

    expect(wrapper.find('.digit-slot').text()).toBe('1')

    vi.advanceTimersByTime(200)
    await nextTick()

    expect(wrapper.find('.digit-slot .new').text()).toBe('2')
  })

  it('updates immediately when debounce is 0', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 100, debounce: 0 }
    })
    await nextTick()

    await wrapper.setProps({ modelValue: 200 })
    await nextTick()
    await nextTick()

    const digits = wrapper.findAll('.digit-slot')
    expect(digits.length).toBe(3)
    expect(digits[0].find('.new').text()).toBe('2')
  })

  it('handles value increase correctly', async () => {
    vi.useRealTimers()
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 5, debounce: 0, stepDuration: 10 },
      attachTo: document.body
    })
    await nextTick()

    await wrapper.setProps({ modelValue: 9 })
    await vi.waitFor(() => expect(gsap.fromTo).toHaveBeenCalled(), {
      timeout: 500
    })

    wrapper.unmount()
  })

  it('handles value decrease correctly', async () => {
    vi.useRealTimers()
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 9, debounce: 0, stepDuration: 10 },
      attachTo: document.body
    })
    await nextTick()

    await wrapper.setProps({ modelValue: 5 })
    await vi.waitFor(() => expect(gsap.fromTo).toHaveBeenCalled(), {
      timeout: 500
    })

    wrapper.unmount()
  })

  it('handles digit count increase', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 99, debounce: 0 }
    })
    await nextTick()

    expect(wrapper.findAll('.digit-slot').length).toBe(2)

    await wrapper.setProps({ modelValue: 100 })
    await nextTick()
    await nextTick()

    expect(wrapper.findAll('.digit-slot').length).toBe(3)
  })

  it('handles digit count decrease', async () => {
    vi.useRealTimers()

    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 100, debounce: 0 }
    })
    await nextTick()

    expect(wrapper.findAll('.digit-slot').length).toBe(3)

    await wrapper.setProps({ modelValue: 99 })
    await nextTick()
    await vi.waitFor(
      () => {
        expect(wrapper.findAll('.digit-slot').length).toBe(2)
      },
      { timeout: 500 }
    )

    vi.useFakeTimers()
  })

  it('does not animate when value unchanged', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 42, debounce: 0 }
    })
    await nextTick()

    vi.clearAllMocks()

    await wrapper.setProps({ modelValue: 42 })
    await nextTick()

    expect(gsap.fromTo).not.toHaveBeenCalled()
  })

  it('uses default increasingDirection as up', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 5, debounce: 0 }
    })
    await nextTick()

    expect(wrapper.props('increasingDirection')).toBe('up')
  })

  it('accepts increasingDirection down', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 5, debounce: 0, increasingDirection: 'down' }
    })
    await nextTick()

    expect(wrapper.props('increasingDirection')).toBe('down')
  })

  it('accepts custom stepDuration', async () => {
    const wrapper = mount(AppleFlavorCounter, {
      props: { modelValue: 5, stepDuration: 100 }
    })
    await nextTick()

    expect(wrapper.props('stepDuration')).toBe(100)
  })
})
