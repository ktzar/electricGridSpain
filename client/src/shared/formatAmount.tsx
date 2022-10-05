const formatter = Intl.NumberFormat('en-GB')

const formatAmount = (nmb : number) => formatter.format(nmb)

export default formatAmount