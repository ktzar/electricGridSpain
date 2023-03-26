import { request, gql } from 'graphql-request';
import { sortByField } from './fields';

const endpoint = "/api/graphql";

export async function fetchInstantByDay(day: string) {
    const data = await request(endpoint, gql`{
        latestInstantByDay(day: "${day}") {
        time,
        solarpv,
        solarthermal,
        wind,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestInstantByDay
}


export async function fetchInstant() {
    const data = await request(endpoint, gql`{
    latestInstant {
        time,
        solarpv,
        solarthermal,
        wind,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestInstant
}

export async function fetchDailyEmissions() {
    const data = await request(endpoint, gql`{
        latestDaily(count: 30) { day, emissions }}`
    )
    return data.latestDaily
}

export async function fetchMonthlyEmissions() {
    const data = await request(endpoint, gql`{
        latestMonthly(count: 12) { month, emissions }}`
    )
    return data.latestMonthly
}

export async function fetchYearlyEmissions() {
    const data = await request(endpoint, gql`{
        latestYearly(count: 15) { year, emissions }}`
    )
    return data.latestYearly
}

export async function fetchDaily() {
    const data = await request(endpoint, gql`{
    latestDaily(count: 30) {
        day,
        solarpv,
        solarthermal,
        wind,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestDaily
}

export async function fetchMonthly() {
    const data = await request(endpoint, gql`{
    latestMonthly(count: 12) {
        month,
        solarpv,
        solarthermal,
        wind,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestMonthly.sort(sortByField('month'))
}

export async function fetchYearly() {
    const data = await request(endpoint, gql`{
    latestYearly(count: 15) {
        year,
        solarpv,
        solarthermal,
        wind,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestYearly.sort(sortByField('year'))
}
