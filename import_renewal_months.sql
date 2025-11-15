-- Import CPA License Renewal Months by State
-- This script updates the renewal_month and notes fields in the state_info table
-- Run this in your Supabase SQL editor

UPDATE public.state_info SET renewal_month = 'September', notes = 'Annually, end of September (typically 9/30).' WHERE state_name = 'Alabama';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 of odd-numbered years.' WHERE state_name = 'Alaska';
UPDATE public.state_info SET renewal_month = 'Varies', notes = 'Last business day of your birth month every 2 years.' WHERE state_name = 'Arizona';
UPDATE public.state_info SET renewal_month = 'January', notes = 'Annual; license date listed as 1/1 (practically, due by start of January).' WHERE state_name = 'Arkansas';
UPDATE public.state_info SET renewal_month = 'Varies', notes = 'Last day of birth month every 2 years.' WHERE state_name = 'California';
UPDATE public.state_info SET renewal_month = 'November', notes = '11/30 of odd-numbered years.' WHERE state_name = 'Colorado';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 every year.' WHERE state_name = 'Connecticut';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 of odd-numbered years.' WHERE state_name = 'Delaware';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 every 2 years.' WHERE state_name = 'Florida';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 of odd-numbered years.' WHERE state_name = 'Georgia';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 of odd-numbered years.' WHERE state_name = 'Hawaii';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 annually.' WHERE state_name = 'Idaho';
UPDATE public.state_info SET renewal_month = 'September', notes = '9/30 every 3 years.' WHERE state_name = 'Illinois';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 every 3 years.' WHERE state_name = 'Indiana';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 annually; CPE cut-off can be June or December by choice.' WHERE state_name = 'Iowa';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 every 2 years (odd licenses in odd years, even in even).' WHERE state_name = 'Kansas';
UPDATE public.state_info SET renewal_month = 'August', notes = '8/1 every 2 years (based on license number).' WHERE state_name = 'Kentucky';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 annually.' WHERE state_name = 'Louisiana';
UPDATE public.state_info SET renewal_month = 'September', notes = '9/30 annually.' WHERE state_name = 'Maine';
UPDATE public.state_info SET renewal_month = 'Varies', notes = 'Every 2 years based on original license issue date.' WHERE state_name = 'Maryland';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 every 2 years.' WHERE state_name = 'Massachusetts';
UPDATE public.state_info SET renewal_month = 'July', notes = 'Registration expires 7/31; renewal window July 1–31 every other year.' WHERE state_name = 'Michigan';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 annually.' WHERE state_name = 'Minnesota';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 annually; CPE uses a July–June cycle.' WHERE state_name = 'Mississippi';
UPDATE public.state_info SET renewal_month = 'September', notes = '9/30 every 2 years.' WHERE state_name = 'Missouri';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 annually.' WHERE state_name = 'Montana';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 every 2 years (odd/even years tied to birth year).' WHERE state_name = 'Nebraska';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 annually.' WHERE state_name = 'Nevada';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 every 3 years, staggered by last name.' WHERE state_name = 'New Hampshire';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 every 3 years.' WHERE state_name = 'New Jersey';
UPDATE public.state_info SET renewal_month = 'Varies', notes = 'Last day of birth month annually.' WHERE state_name = 'New Mexico';
UPDATE public.state_info SET renewal_month = 'Varies', notes = 'Every 3 years based on license issue date (or birth month on older licenses).' WHERE state_name = 'New York';
UPDATE public.state_info SET renewal_month = 'June', notes = 'Must renew before 7/1 each year; effectively due in June.' WHERE state_name = 'North Carolina';
UPDATE public.state_info SET renewal_month = 'June', notes = 'Typically 6/30 annually; CPE often reportable through 7/31 without late fee.' WHERE state_name = 'North Dakota';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 every 3 years; renewal window Oct–Dec.' WHERE state_name = 'Ohio';
UPDATE public.state_info SET renewal_month = 'Varies', notes = 'Last day of birth month annually.' WHERE state_name = 'Oklahoma';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 every 2 years (odd/even by license number).' WHERE state_name = 'Oregon';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 of odd-numbered years.' WHERE state_name = 'Pennsylvania';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 every 3 years, staggered by last name.' WHERE state_name = 'Rhode Island';
UPDATE public.state_info SET renewal_month = 'January', notes = '1/31 annually.' WHERE state_name = 'South Carolina';
UPDATE public.state_info SET renewal_month = 'August', notes = '8/1 annually.' WHERE state_name = 'South Dakota';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 every 2 years (odd/even by license number).' WHERE state_name = 'Tennessee';
UPDATE public.state_info SET renewal_month = 'Varies', notes = 'Last day of birth month each year.' WHERE state_name = 'Texas';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 of even-numbered years (2-year cycle).' WHERE state_name = 'Utah';
UPDATE public.state_info SET renewal_month = 'July', notes = '7/31 of odd-numbered years.' WHERE state_name = 'Vermont';
UPDATE public.state_info SET renewal_month = 'June', notes = 'Single renewal date 6/30 every year.' WHERE state_name = 'Virginia';
UPDATE public.state_info SET renewal_month = 'April', notes = '4/30 every 3 years, based on issue date.' WHERE state_name = 'Washington';
UPDATE public.state_info SET renewal_month = 'June', notes = '6/30 annually.' WHERE state_name = 'West Virginia';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/14 every 2 years (odd-numbered years).' WHERE state_name = 'Wisconsin';
UPDATE public.state_info SET renewal_month = 'December', notes = '12/31 annually.' WHERE state_name = 'Wyoming';

