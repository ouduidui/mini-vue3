import {reactive} from "../src/reactive";
import {computed} from "../src/computed";
import {ref, isRef} from "../src/ref"

describe('computed', () => {
    it('happy path', () => {
        const user = reactive({
            age: 1
        });

        const age = computed(() => {
            return user.age;
        })

        expect(age.value).toBe(1);
        expect(isRef(age)).toBe(true)
    })

    it('should compute lazily', () => {
        const value = reactive({
            foo: 1
        });
        const getter = jest.fn(() => {
            return value.foo;
        });
        const cValue = computed(getter);

        // lazy
        expect(getter).not.toHaveBeenCalled();

        expect(cValue.value).toBe(1);
        expect(getter).toHaveBeenCalledTimes(1);

        expect(cValue.value).toBe(1);
        expect(getter).toHaveBeenCalledTimes(1);

        value.foo = 2;
        expect(getter).toHaveBeenCalledTimes(1);
        expect(cValue.value).toBe(2);
        expect(getter).toHaveBeenCalledTimes(2);
    })

    it('should support setter', () => {
        const n = ref(1)
        const plusOne = computed({
            get: () => n.value + 1,
            set: val => {
                n.value = val - 1
            }
        })

        expect(plusOne.value).toBe(2)
        n.value++
        expect(plusOne.value).toBe(3)

        plusOne.value = 0
        expect(n.value).toBe(-1)
    })
})
