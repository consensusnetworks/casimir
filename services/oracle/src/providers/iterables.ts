export async function* mergeAsyncIterables(iterables: AsyncIterable<any>[]) {
    const promises = iterables.map(iterable => iterable[Symbol.asyncIterator]().next())

    while (promises.length > 0) {
        const { index, value } = await Promise.race(
            promises.map((promise, index) => promise.then(value => ({ index, value })))
        )

        if (!value.done) {
            promises[index] = iterables[index][Symbol.asyncIterator]().next()
            yield value.value
        } else {
            promises.splice(index, 1)
        }
    }
}