import {LocalDate, LocalDateTime} from "@js-joda/core";

(() => {
    const date1 = LocalDateTime.parse("2023-01-01T00:00:00.001");
    const monthAgo = date1.minusMonths(5);
    const weekAgo = date1.minusWeeks(1);
    const dayAgo = date1.minusDays(1);
    const shiftAgo = date1.minusHours(8);
    const hourAgo = date1.minusHours(1);

    console.log(date1.toString());
    console.log(monthAgo.toString());
    console.log(weekAgo.toString());
    console.log(dayAgo.toString());
    console.log(shiftAgo.toString());
    console.log(hourAgo.toString());
})()