-- Import todos from CSV file
-- This script imports todos from the CSV data
-- Run this in your Supabase SQL Editor

-- First, get user IDs for Andy and Dave, and calculate sort_order
DO $$
DECLARE
  andy_user_id UUID;
  dave_user_id UUID;
  max_sort_order INTEGER;
  current_sort_order INTEGER;
BEGIN
  -- Get user IDs from profiles
  SELECT id INTO andy_user_id FROM public.profiles WHERE name = 'Andy' LIMIT 1;
  SELECT id INTO dave_user_id FROM public.profiles WHERE name = 'Dave' LIMIT 1;
  
  -- Get max sort_order to continue from
  SELECT COALESCE(MAX(sort_order), 0) INTO max_sort_order FROM public.todos;
  current_sort_order := max_sort_order + 1;
  
  -- Insert todos
  INSERT INTO public.todos (title, description, due_date, assigned_to, user_id, is_recurring, recurring_pattern, is_company_task, sort_order, color, tags)
  VALUES
    -- Row 2
    ('Website: Update Homepage Courses-Q2', NULL, NULL, andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order, NULL, NULL),
    
    -- Row 3
    ('Marketing: Find inexpensive online ad opportunities in trade publications', NULL, NULL, andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 1, NULL, NULL),
    
    -- Row 4
    ('CA  R and R course renewal: expires two years - next-1/31/2027', NULL, 
     TO_TIMESTAMP('12/15/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 2, NULL, NULL),
    
    -- Row 5
    ('Check Termly for consent', NULL, NULL, andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 3, NULL, NULL),
    
    -- Row 6
    ('Courses- Updates: 594721 on next update: Corp discount Merit Energy: update course number or remove it and leave title only in Promo Maint. Edit:5947-Grammar', NULL, NULL, NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 4, NULL, NULL),
    
    -- Row 7
    ('Corporate: Strategic Plan', NULL,
     TO_TIMESTAMP('03/05/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 5, NULL, NULL),
    
    -- Row 8
    ('ops@bhfe.com: change of email addresses', NULL, NULL, NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 6, NULL, NULL),
    
    -- Row 9
    ('Sales: Raise print prices?-see Google Master Course List, PrintPrice', NULL, NULL, andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 7, NULL, NULL),
    
    -- Row 10
    ('Marketing: Contact MA Society of CPAs for Mktg opportunities', 
     'Emailed Claire @ MA 411/24, no response as of 4/29/24.', 
     NULL, dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 8, NULL, NULL),
    
    -- Row 11
    ('MASS Connect: File Return: Sales Tax - Sales Tax folder for instruction using plug in',
     'We file this quarterly. File return online showing MA sales for quarter for Gross sales and for Exempt sales resulting in a  $0 tax due.',
     TO_TIMESTAMP('10/01/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 9, NULL, NULL),
    
    -- Row 12
    ('Courses: CIB Book editions Check for new (Quarterly)', NULL, NULL, andy_user_id, andy_user_id, TRUE, 'monthly', FALSE, current_sort_order + 10, NULL, NULL),
    
    -- Row 13
    ('Royalties (Monthly)', NULL, NULL, dave_user_id, andy_user_id, TRUE, 'monthly', FALSE, current_sort_order + 11, NULL, NULL),
    
    -- Row 14
    ('MASS Connect: Corp Excise Tax (Annually) Auto pay from Krupsky',
     'Pay fee online.',
     TO_TIMESTAMP('02/13/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 12, NULL, NULL),
    
    -- Row 15
    ('Website: SSL Certificate logo Display',
     'Others with: MastrerCPE;  Kakplan: ISO 27001 Compliant; Mypescpe; Other without: Surgent; Becker; CPECredit; Cerrifi; Western CPE; Sequoia',
     TO_TIMESTAMP('02/11/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 13, NULL, NULL),
    
    -- Row 16
    ('Payroll: Annual Payroll to Payroll Mgt',
     'See file in Operations, BHFE-Financial, Salaries-Payroll Mgt. Copy last year''s sheet to new Excel sheet and update dates, contribution limits, salaries, etc. Make PDF and send to Payroll Management FIRST WEEK OF January. ',
     TO_TIMESTAMP('01/06/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 14, NULL, NULL),
    
    -- Row 17
    ('Courses: CPA Ethics Rules Check (state specific)', NULL, NULL, andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 15, NULL, NULL),
    
    -- Row 18
    ('Marketing: PC Mailings: NCOA Address Corrections', NULL, NULL, dave_user_id, andy_user_id, TRUE, 'monthly', FALSE, current_sort_order + 16, NULL, NULL),
    
    -- Row 19
    ('Credit Card Settlements-Update Spreadsheet (Sales folder) Update weekly', NULL, NULL, dave_user_id, andy_user_id, TRUE, 'weekly', FALSE, current_sort_order + 17, NULL, NULL),
    
    -- Row 20
    ('Mass Connect/Payroll MGT: Paid Family & Med Leave Tax Form quarterly',
     'Payroll Management is responsible for this. Check that it was done.',
     NULL, dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 18, NULL, NULL),
    
    -- Row 21
    ('CPWA/CIMA: Register and submit courses, Activate courses after admin changes.',
     'Send email to our customers when done. Mark can do work week of 4/8-12',
     NULL, andy_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 19, NULL, NULL),
    
    -- Row 22
    ('Archive 291724 and 491824',
     'Carolynn Tomin (author) lets us know a supplement is available for her book. She sends a Word doc showing only those sections that are changed. We edit them into the PDF. See Read Me file in course folder.',
     TO_TIMESTAMP('07/01/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 20, NULL, NULL),
    
    -- Row 23
    ('Essentials of Annuities. Disability Insurance - add CFP CE?', NULL, NULL, NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 21, NULL, NULL),
    
    -- Row 24
    ('Courses: Updates, All: Check weekly for Santucci, emails to dave@ for others.', NULL, NULL, NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 22, NULL, NULL),
    
    -- Row 25
    ('Course Pricing Strategy 2025', NULL,
     TO_TIMESTAMP('02/02/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     dave_user_id, andy_user_id, TRUE, 'monthly', FALSE, current_sort_order + 23, NULL, NULL),
    
    -- Row 26
    ('Course Reviews', NULL, NULL, NULL, andy_user_id, TRUE, 'monthly', FALSE, current_sort_order + 24, NULL, NULL),
    
    -- Row 27
    ('Reporting (Monthly)', NULL, NULL, andy_user_id, andy_user_id, TRUE, 'monthly', FALSE, current_sort_order + 25, NULL, NULL),
    
    -- Row 28
    ('NY Sponsorship: Submitted and rec''d 5/13 Expr Mail, confirm renewal',
     'Expires 8/31/27. Began submitting one course in each subject area plus outlines of both ethics courses.',
     TO_TIMESTAMP('05/01/2027', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 26, NULL, NULL),
    
    -- Row 29
    ('BHFE Trademark: Declaration of use required years (due 6/9/2030). See Trademark paper folder. Mark Guay will also remind us.', NULL,
     TO_TIMESTAMP('03/04/2030', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 27, NULL, NULL),
    
    -- Row 30
    ('Judy Brophy email bank, CC and Payroll statements monthly', NULL,
     TO_TIMESTAMP('01/14/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 28, NULL, NULL),
    
    -- Row 31
    ('IRS Renewal 2026 due 12/31', NULL,
     TO_TIMESTAMP('12/31/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     dave_user_id, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 29, NULL, NULL),
    
    -- Row 32
    ('CA R and R course expires 1/31/25-switch to Bragg course before then.', NULL, NULL, NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 30, NULL, NULL),
    
    -- Row 33
    ('FL Ethics: Expires 6/30/27 (2 yrs). last Email received 3/6/25. Board reviewed via phone 5/11/25', NULL,
     TO_TIMESTAMP('03/01/2027', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 31, NULL, NULL),
    
    -- Row 34
    ('HI Ethics: Expires 12/31/25. 9/23/25: 2 Years (Expect email notice to dave@) emailed Board for form (ops).', NULL,
     TO_TIMESTAMP('09/15/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 32, NULL, NULL),
    
    -- Row 35
    ('LA Ethics 2026: Submitted Course for review 9/4/25. 11/21/25: still no approval.',
     'Due July 1, 2-25. Step two, course submission, August 31 or after.',
     TO_TIMESTAMP('09/15/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 33, NULL, NULL),
    
    -- Row 36
    ('MS Ethics expires 6/30/28. Last time approved 5/22/25 by Helen Wright Mcneal to Dave@-Launched 5/22/25.', NULL,
     TO_TIMESTAMP('04/01/2028', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 34, NULL, NULL),
    
    -- Row 37
    ('NY Ethics (2 courses) Expires 8/31/27. Expect email or mail in april', NULL,
     TO_TIMESTAMP('04/15/2027', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 35, NULL, NULL),
    
    -- Row 38
    ('TX Ethics sponsor renewal annually. expires 9/30. Expect notice August Recd App 8/13/25. Submitted Express M 8/27/25', NULL,
     TO_TIMESTAMP('08/15/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 36, NULL, NULL),
    
    -- Row 39
    ('WA Ethics 2026 Approved. Begin offering 1/1/26 then reset to do for 2027.     Check online for announcement. Issue to Lambers and CPE W', NULL,
     TO_TIMESTAMP('01/01/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 37, NULL, NULL),
    
    -- Row 40
    ('CA R R Bragg-Prep and Submit Spring 2025 to have simuiltaneously with Mill creek version then retire Mill Creek  Jan 27', NULL,
     TO_TIMESTAMP('05/01/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 38, NULL, NULL),
    
    -- Row 41
    ('IRS Renewal', NULL,
     TO_TIMESTAMP('11/05/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 39, NULL, NULL),
    
    -- Row 42
    ('Commercial Credit Line "Evergreen LOC" Admin Fee due Feb 1 annually. Pay with Co. check', NULL,
     TO_TIMESTAMP('01/14/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 40, NULL, NULL),
    
    -- Row 43
    ('OHIO 4701.06-Update law eff 1-1-2026',
     'See OH Law comparison 2024 Vs Eff 101-2026',
     TO_TIMESTAMP('12/01/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 41, NULL, NULL),
    
    -- Row 44
    ('CPE World, Lambers-Royalties? Reced some from CPE W and Lambers as of May 2025', NULL,
     TO_TIMESTAMP('01/15/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 42, NULL, NULL),
    
    -- Row 45
    ('AICPA Membership (Affiliate) $355 - pay online each May, Email reminder to dave@bhfe.com', NULL,
     TO_TIMESTAMP('05/15/2026', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 43, NULL, NULL),
    
    -- Row 46
    ('Rhode Island ethics-no longer state specific, convert to generic @ 6 Hrs: use 5904 + 2 cpe bragg.', NULL,
     TO_TIMESTAMP('10/01/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 44, NULL, NULL),
    
    -- Row 47
    ('CFP Renewal', NULL,
     TO_TIMESTAMP('11/04/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 45, NULL, NULL),
    
    -- Row 48
    ('PA Sponsor (2 YEARS) Approved and renewed 11/3/2025. Notice emailed late Oct/early Nov. see Step by Step ', NULL,
     TO_TIMESTAMP('10/01/2027', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 46, NULL, NULL),
    
    -- Row 49
    ('WA Ethics to Lambers and CPE World for beginning 1/1/26', NULL,
     TO_TIMESTAMP('12/23/2025', 'MM/DD/YYYY') AT TIME ZONE 'America/New_York',
     NULL, andy_user_id, FALSE, NULL, FALSE, current_sort_order + 47, NULL, NULL);

  RAISE NOTICE 'Imported 48 todos successfully. Starting sort_order: %, Ending sort_order: %', max_sort_order + 1, current_sort_order + 47;
  
  IF andy_user_id IS NULL THEN
    RAISE WARNING 'Andy user not found in profiles table';
  END IF;
  
  IF dave_user_id IS NULL THEN
    RAISE WARNING 'Dave user not found in profiles table';
  END IF;
END $$;
