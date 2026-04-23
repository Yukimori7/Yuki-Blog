export const formatDate = (value: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(value)
    .replace(/\//g, '-')

export const formatMonthDay = (value: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
    .format(value)
    .replace(/\//g, '-')
