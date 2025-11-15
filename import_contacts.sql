-- Import Contacts from CSV
-- This script imports contacts from the contacts import.csv file
-- IMPORTANT: Replace 'your-email@example.com' with the actual email of the user who should own these contacts
-- You can find user emails in the auth.users table or profiles table

-- First, get the user_id for the user who should own these contacts
-- Replace the email address with the actual user's email (e.g., 'andy@bhfe.com' or 'dave@bhfe.com')
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id from auth.users table (replace email with actual user email)
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'andy@bhfe.com'  -- CHANGE THIS EMAIL ADDRESS
  LIMIT 1;

  -- If not found, try to get from profiles table
  IF target_user_id IS NULL THEN
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'andy@bhfe.com'  -- CHANGE THIS EMAIL ADDRESS
    LIMIT 1;
  END IF;

  -- If still not found, raise an error
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please update the email address in this script.';
  END IF;

  -- Insert contacts
  INSERT INTO public.contacts (user_id, name, email, email_2, phone, phone_2, website, fpa_chapter, state, company, notes, tags)
  VALUES
    -- Row 1
    (target_user_id, 'Christopher Demaline', 'cddem73@gmail.com', 'christopher.demaline@centralaz.edu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Author']),
    
    -- Row 2
    (target_user_id, 'CFO Resources, LLC', 'jhelstrom@yahoo.com', 'patricia@cpaselfstudy.com', NULL, NULL, NULL, NULL, NULL, NULL, 'Also is Mill Creek Publishing (make royalty checks out to this). Authors are Patricia McCarthy: mailto:patricia@cpaselfstudy.com and Joseph P. Helstrom, CPA: mailto:jhelstrom@yahoo.com', ARRAY['Author']),
    
    -- Row 3
    (target_user_id, 'The National Underwriter Company', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Part of ALM company. Attn: Leslie Perry  (lperry@alm.com) Also, Jay Caslow (NU college) for new titles and getting course files: mailto:jcaslow@alm.com Beginning 2021: course prices sold: we pay additional 5% from previous', ARRAY['Author']),
    
    -- Row 4
    (target_user_id, 'Paul Winn', 'pjwinn@verizon.net', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Author']),
    
    -- Row 5
    (target_user_id, 'Steven C. Fustolo, CPA', 'fust@aol.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Author']),
    
    -- Row 6
    (target_user_id, 'Steven Bragg', 'bragg.steven@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, 'Accounting Tools, Inc.', 'Make royalty checks out to Accounting Tools, Inc.', ARRAY['Author']),
    
    -- Row 7
    (target_user_id, 'Danny Santucci', 'sanpub@earthlink.net', NULL, NULL, NULL, NULL, NULL, NULL, 'Santucci Publishing', NULL, ARRAY['Author']),
    
    -- Row 8
    (target_user_id, 'Allison M. McLeod, LL.M., CPA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '(We pay her 25% not 20%)', ARRAY['Author']),
    
    -- Row 9
    (target_user_id, 'Aaron Benway', 'aaron@hsacoach.com', NULL, NULL, NULL, NULL, NULL, NULL, 'HSA Consulting Services', '(as of 1/2018, one course: Health savings Accounts)', ARRAY['Author']),
    
    -- Row 10
    (target_user_id, 'Andrew Clark', 'Taxcepublishing@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, 'Tax CE Publishing', 'New in 2019', ARRAY['Author']),
    
    -- Row 11
    (target_user_id, 'Brette Sember', 'brette@brettesember.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Author']),
    
    -- Row 12
    (target_user_id, 'Lambers, Inc.', 'nam@lambers.com', NULL, '(800) 272-0707', '(727) 967-6364', NULL, NULL, NULL, NULL, 'Neil Marr The sell our CPA ethics courses.', ARRAY['Author']),
    
    -- Row 13
    (target_user_id, 'Frank Castillo', 'Frank.castillo.cpa@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'New in 2021', ARRAY['Author']),
    
    -- Row 14
    (target_user_id, 'Minuteman Press', 'nikki@minutemanpress.com', NULL, NULL, NULL, NULL, NULL, NULL, 'Nikki Misenheimer', NULL, ARRAY['Marketing']),
    
    -- Row 15
    (target_user_id, 'CFP Board', NULL, NULL, '(202) 379-2221', NULL, NULL, NULL, NULL, NULL, 'Courses that carry CFP credit are registered with them. They dictate standards for CFP courses. Contacts: Alex Torres, manager, continuing education and experience (new in 2019) Matthew Hughes, CE Administrator Hasika Wijegunawardana', ARRAY['Governing Body']),
    
    -- Row 16
    (target_user_id, 'NASBA (National Assn. of State Boards of Accountancy)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Cynthia Woodlee: mailto:cwoodlee@nasba.org. Phone: 615-312-3838. Ashlee Baker: mailto:abaker@nasba.org. Phone: 615-312-3795.', 'This is the governing body for CPAs. We have annual CPE sponsor renewal: We receive notice July 1; application due August 1 (course list, fee, etc.). General number for NASBA National Registry of CPE Sponsors: 866-627-2286. CPE marketing site where we list our courses:https://www.nasbaregistry.org/provider-zone-login ID: mailto:contact@bhfe.com Pass: GC19W', ARRAY['Governing Body']),
    
    -- Row 17
    (target_user_id, 'IRS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Enrolled agents are experts in tax. The IRS oversees their licenses. We are registered with IRS and our tax courses are registered with the IRS.. 2019: Random audit of course being conducted (September, 2019). We do the credit reporting for Enrolled Agents who have a PTIN number) https://www.ceprovider.us/ No contact info. ID: mailto:dave@bhfe.com & password IRS contact info for providers (sponsors): 855-296-3150 (M–F, 9–6) We are sponsor # FWKKO Annual sponsor registration and fee (online) each December.', ARRAY['Governing Body']),
    
    -- Row 18 - Delaware
    (target_user_id, 'Delaware Board of Accountancy', NULL, NULL, '(302) 744-4500', NULL, 'www.dpr.delaware.gov', NULL, 'Delaware', 'LaTanya Brown', 'BHFE-written —Course expiration: Every two years. Next 5/2023, Ethics course. Submit course for review by the board meeting scheduled one or two months before the expiration date', ARRAY['Board of Accountancy']),
    
    -- Row 19 - Florida
    (target_user_id, 'Florida Board of Accountancy', NULL, NULL, '(352) 333-2505', NULL, 'www.myfloridalicense.com', NULL, 'Florida', 'Karen Lee', 'BHFE-written — 2 year course expiration. Next: 6/30/23, Ethics course and sponsorship. They send us a letter with the app in Early March to submit by April 30. Send course and app by express mail. Fee is $250. Provider # 4761 Ethics course No. 11467', ARRAY['Board of Accountancy']),
    
    -- Row 20 - Hawaii
    (target_user_id, 'Hawaii Board of Accountancy', NULL, NULL, '(808) 586-2696', NULL, 'www.cca.hawaii.gov/pvl', NULL, 'Hawaii', 'Celia C. Suzuki Lori Nishimura', NULL, ARRAY['Board of Accountancy']),
    
    -- Row 21 - Louisiana
    (target_user_id, 'Louisiana Board of Accountancy', NULL, NULL, '504-566-1244, ext. 105', NULL, 'www.cpaboard.state.la.us', NULL, 'Louisiana', 'Darla Saux', 'BHFE-written Ethics course in 2022. Submit annually by invitation (they select a finite number of sponsors)', ARRAY['Board of Accountancy']),
    
    -- Row 22 - Mississippi
    (target_user_id, 'Mississippi Board of Accountancy', NULL, NULL, '518-474-3817, ext. 160', NULL, 'cpabd@mail.nysed.gov', NULL, 'Mississippi', 'Donna Murray Glen Tesch', 'Sponsorship: three-year renewal: Next: 8/31/2022. Submit application with $250 fee (sponsorship fee only- No additional fee for courses as we are NASBA sponsor.) On Application, list the two ethics courses only. All other courses do not need to be listed as they are NASBA-registered. Ethics courses (2): BHFE-written — 8/31/22, Submit outline of two ethics courses with sponsor application. If a significant change is made to either course in the interim, send them an outline.', ARRAY['Board of Accountancy']),
    
    -- Row 23 - New York
    (target_user_id, 'New York Board of Accountancy', NULL, NULL, '(601) 354-7320', NULL, 'www.msbpa.ms.gov', NULL, 'New York', NULL, 'BHFE-written (we were invited to submit a course and the course was selected to be one of the few approved for sale. 3 year ethics course renewal cycle — 6/30/22, Ethics', ARRAY['Board of Accountancy']),
    
    -- Row 24 - Ohio
    (target_user_id, 'Ohio Board of Accountancy', 'Robert.Joseph@ace.state.oh.us', NULL, '(614) 466-4135', NULL, NULL, NULL, 'Ohio', 'Ronald J. Rotaru, executive director', 'Sponsorship: annual renewal, 5/31/annually. Sponsor number CPE .51 PSR Ethics course: BHFE-written — Annual ethics course renewal: 5/31/XX. Complete application and submit with course and keyed exam via PDF/email to: Elisabeth Newell, Education Assistance Secretary 614-728-6764', ARRAY['Board of Accountancy']),
    
    -- Row 25 - Oregon
    (target_user_id, 'Oregon Board of Accountancy', NULL, NULL, NULL, NULL, NULL, NULL, 'Oregon', NULL, '(BHFE written) Statutes and Regulations course Next renewal 3/31/22', ARRAY['Board of Accountancy']),
    
    -- Row 26 - Pennsylvania
    (target_user_id, 'Pennsylvania Board of Accountancy', NULL, NULL, NULL, NULL, NULL, NULL, 'Pennsylvania', NULL, 'Sponsorship only. "license number" PX178025, expires 12/31 of odd years. Application submitted in October/November.', ARRAY['Board of Accountancy']),
    
    -- Row 27 - South Carolina
    (target_user_id, 'South Carolina Board of Accountancy', NULL, NULL, '(803) 896-4770', NULL, NULL, NULL, 'South Carolina', 'Susanna Sharpe CPA, Administrator', 'Course expires 12/31/2022. Course to be written by NASBA Center for Public Trust beginning 2020.', ARRAY['Board of Accountancy']),
    
    -- Row 28 - Tennessee
    (target_user_id, 'Tennessee Board of Accountancy', 'aserrana@tsbpa.state.tx.us', NULL, '(512) 305-7851', NULL, 'www.tsbpa.state.tx.us', NULL, 'Tennessee', 'April Serrana', 'Two Ethics courses by external authors Joseph Helstrom at Mill Creek Publishing (#5948) and Allison McLeod (#5947)l. Each is renewed/reviewed by author every three years. Sponsor renewal annually; due 9/30. We receive notice from Board every mid-August in regular mail. Submit a application by mail. No fee as we are NASBA sponsor. We also submit a course list (see paper file).', ARRAY['Board of Accountancy']),
    
    -- Row 29 - Texas
    (target_user_id, 'Texas Board of Accountancy', NULL, NULL, NULL, NULL, NULL, NULL, 'Texas', NULL, 'Course renewal: Mar-April annually. We are registered as an approved provider for the ethics course, which is written by the TN Society of CPAs. We purchase the course from them for $20 per registrant. We submit a list of registrants who completed the course each month, and the Society sends us an invoice. We submit the sponsor application at the beginning of each year (they send a letter in early January via email). We submit the application then wait for notice of the availability of the course. Also, see paper file for requirements for submitting evaluations to the TN Board of Accountancy separately.', ARRAY['Board of Accountancy']),
    
    -- Row 30 - Virginia
    (target_user_id, 'Virginia Board of Accountancy', NULL, NULL, NULL, NULL, NULL, NULL, 'Virginia', NULL, 'Submit annually in Fall for Feb 1 launch. 2 cpe approved bv the VBOA: Course is based on our generic 2-hour ethics course (5902) plus a VBOA-provided video link and handout. Need to include link in course to VBOA online course evaluation form. No fee required . We are listed on VBOA website.', ARRAY['Board of Accountancy']),
    
    -- Row 31 - Washington
    (target_user_id, 'Washington Board of Accountancy', 'ricks@cpaboard.wa.gov', 'kellyw@cpaboard.wa.gov', '(360) 753-2586', NULL, 'www.cpaboard.wa.gov', NULL, 'Washington', 'Richard Sweeney, executive director Kelly Wulfekuhle, administrative asst.', 'Annual ethics course renewal: 12/31. Submit in October-see checklist in paper file..', ARRAY['Board of Accountancy']),
    
    -- Row 32
    (target_user_id, 'Mark J. Guay, P.C.', 'markguay@verizon.net', NULL, '(978) 465-5333', NULL, NULL, NULL, NULL, NULL, 'Manages corporate records, generates and files our annual report each year, makes sure we meet corporate requirements needed by state of Massachusetts. Each January, need to complete paperwork provided by Mark for annual report that is filed with the MA Dept of Revenue. Past projects: •  Moved corporation to MA in 2012-2014 •  Trademark registration for Beacon Hill (completed in 2020)', ARRAY['Legal']),
    
    -- Row 33
    (target_user_id, 'Ouellette & Associates, PA', 'trobustelli@oacpas.net', NULL, '(239) 692-8061', NULL, NULL, NULL, NULL, NULL, 'Tom Robustelli, accountant. Provides bookkeeping, accounting, tax services. Offices in Lewiston, ME, and Naples, FL.', ARRAY['Financial']),
    
    -- Row 34
    (target_user_id, 'Payroll Management Company', 'CherylC@payrollmgt.com', NULL, '(800) 734-6880', NULL, NULL, NULL, NULL, NULL, 'Tammy Pelletier (new) Client Service Representative', ARRAY['Financial']),
    
    -- Row 35
    (target_user_id, 'IPayment', 'merchantsupport@merchants-help.com', NULL, '(800) 554-4777', NULL, NULL, NULL, NULL, NULL, 'credit card processing company. Merchant Number: 4223699300064236 Merchant Name: Beacon Hill Financial Customer service: same as above After hours: 800-228-0210', ARRAY['Financial']),
    
    -- Row 36
    (target_user_id, 'authorize.net', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Payment gateway Nashville Platform ID# 1835148 Deposit/Debit information provided to Key Bank: SD077S4866 Website: http://iaccessportal.com/ Merchant bank processor bank (for iPayments): Wells Fargo Wells Fargo ID# SM 077 S4866 Note that American Express processes their own credit transactions and then passes them on to iPayment. BHFE has an online account with them.', ARRAY['Financial']),
    
    -- Row 37
    (target_user_id, 'Platinum Acceptance, LLC', 'matt@platinumacceptance.com', NULL, '617-702-4050 ext 707', NULL, NULL, NULL, NULL, 'Matt Sullivan', 'Other merchant account contact:', ARRAY['Financial']),
    
    -- Row 38
    (target_user_id, 'Key Bank', NULL, NULL, '(207) 729-2600', NULL, NULL, NULL, NULL, NULL, 'BHFE has a checking account, savings account, and commercial credit line with Key Bank.', ARRAY['Financial']),
    
    -- Row 39
    (target_user_id, 'Molly Lovas', 'molly@appliedenglishconsulting.com', NULL, '(406) 579-1756', NULL, 'www.appliedenglishconsulting.com', NULL, NULL, 'Molly Lovas', 'writes exam questions (for any of our courses)', ARRAY['Exam Writer']),
    
    -- Row 40
    (target_user_id, 'Elissa A. Weick', 'fpali@optonline.net', NULL, NULL, NULL, NULL, 'Long Island', 'New York (Long Island)', NULL, NULL, ARRAY['FPA Chapter']),
    
    -- Row 41
    (target_user_id, 'Lawrence Sangirardi', NULL, NULL, NULL, NULL, NULL, 'Long Island', NULL, NULL, NULL, ARRAY['Workshop Instructor']),
    
    -- Row 42
    (target_user_id, 'Mark Badami', NULL, NULL, NULL, NULL, NULL, 'Long Island', NULL, NULL, NULL, ARRAY['Workshop Instructor']),
    
    -- Row 43
    (target_user_id, 'Curt Weil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Workshop Instructor']),
    
    -- Row 44
    (target_user_id, 'Judy Brophy', 'affordbookkeeping@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Bookkeeper']);

END $$;

