# PDF Summary Design

## Job Completion Summary Document

**Purpose:** Professional PDF document sent to customers when their job is completed, containing all relevant job information, before/after photos, and invoice details.

**Generation:** On-demand via API (not stored)  
**Trigger:** When job status changes to "Completed"  
**Delivery:** Attached to completion email

---

## PDF Layout & Structure

### Page 1: Header & Customer Information

```
┌─────────────────────────────────────────────────────────┐
│  [Company Logo/Name]          Job Completion Summary   │
│  RPS Micro Electronics        Generated: [Date/Time]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CUSTOMER INFORMATION                                   │
│  ─────────────────────                                  │
│  Customer Name: [Customer Name]                         │
│  Contact Number: [Phone]                                │
│  Email: [Email]                                         │
│  Address: [Full Address]                                │
│                                                         │
│  JOB DETAILS                                            │
│  ────────────                                           │
│  Job Number: [JOB-001]                                  │
│  Booking Date: [Date & Time]                            │
│  Completion Date: [Date]                                │
│  Delivery Date: [Date] (if set)                         │
│  Material Type: [Material Type]                          │
│                                                         │
│  STATUS                                                 │
│  ──────                                                 │
│  [✓] Completed                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Page 2: Special Requirements & Work Summary

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  SPECIAL REQUIREMENTS                                  │
│  ─────────────────────                                  │
│  [Special requirements text, if any]                    │
│                                                         │
│  WORK SUMMARY                                           │
│  ───────────                                            │
│  Your CNC machine part repair has been completed       │
│  successfully. Please find the details below.           │
│                                                         │
│  • Job completed on: [Completion Date]                  │
│  • All work has been finished as per requirements      │
│  • Ready for pickup/delivery                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Page 3+: Before Photos Section

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  BEFORE PHOTOS                                          │
│  ────────────                                           │
│  Photos taken at the time of job collection:           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Photo 1 │  │  Photo 2 │  │  Photo 3 │           │
│  │          │  │          │  │          │           │
│  │  [Image] │  │  [Image] │  │  [Image] │           │
│  │          │  │          │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                         │
│  [Continue with more photos if available]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Page 4+: After Photos Section

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  AFTER PHOTOS                                           │
│  ───────────                                            │
│  Photos taken after work completion:                    │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Photo 1 │  │  Photo 2 │  │  Photo 3 │           │
│  │          │  │          │  │          │           │
│  │  [Image] │  │  [Image] │  │  [Image] │           │
│  │          │  │          │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                         │
│  [Continue with more photos if available]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Last Page: Invoice & Contact Information

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  INVOICE INFORMATION                                    │
│  ──────────────────                                     │
│                                                         │
│  Your invoice is available:                             │
│                                                         │
│  [Option 1: If invoice URL provided]                    │
│  Invoice Link: [Clickable Tally Invoice URL]            │
│                                                         │
│  [Option 2: If invoice file uploaded]                 │
│  Invoice has been attached to this email.              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  CONTACT INFORMATION                                    │
│  ──────────────────                                     │
│                                                         │
│  If you have any questions or concerns, please contact: │
│                                                         │
│  RPS Micro Electronics                                  │
│  [Business Address]                                     │
│  Phone: [Business Phone]                                │
│  Email: [Business Email]                                │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Thank you for choosing RPS Micro Electronics!        │
│                                                         │
│  Generated on: [Date & Time]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Design Specifications

### Typography

- **Header Font:** Bold, 24pt
- **Section Headers:** Bold, 16pt
- **Body Text:** Regular, 11pt
- **Labels:** Bold, 10pt
- **Values:** Regular, 10pt

### Colors

- **Primary Color:** Blue (#3B82F6) for headers and accents
- **Text Color:** Black (#000000) for body text
- **Borders:** Light Gray (#E5E7EB)
- **Background:** White (#FFFFFF)

### Spacing

- **Page Margins:** 0.75 inches (all sides)
- **Section Spacing:** 20pt between sections
- **Line Spacing:** 1.2 for body text

### Images

- **Photo Size:** Max 4 inches width, maintain aspect ratio
- **Photo Quality:** High quality (300 DPI if possible)
- **Photo Layout:** 2-3 photos per row, depending on page width
- **Photo Captions:** Optional, small text below each photo

### Page Size

- **Standard:** US Letter (8.5" x 11") or A4 (210mm x 297mm)
- **Orientation:** Portrait

---

## Content Sections (Detailed)

### 1. Header Section

- Company name/logo (if available)
- Document title: "Job Completion Summary"
- Generation timestamp
- Job number (prominent)

### 2. Customer Information

- Full customer name
- Contact number
- Email address
- Complete address

### 3. Job Details

- Job number (unique identifier)
- Booking date and time
- Completion date
- Delivery date (if specified)
- Material type
- Current status (Completed)

### 4. Special Requirements

- Display special requirements if provided
- If none, show "No special requirements"

### 5. Before Photos

- Section header: "Before Photos"
- Subtitle: "Photos taken at the time of job collection"
- Grid layout of all before photos
- Each photo labeled (Photo 1, Photo 2, etc.)

### 6. After Photos

- Section header: "After Photos"
- Subtitle: "Photos taken after work completion"
- Grid layout of all after photos
- Each photo labeled (Photo 1, Photo 2, etc.)

### 7. Invoice Section

- **If Tally URL provided:**
  - "Invoice Link: [Clickable URL]"
  - Instructions to click and download
- **If invoice file uploaded:**
  - "Invoice has been attached to this email"
  - Note that invoice is in separate attachment

### 8. Contact Information

- Business name
- Business address
- Business phone
- Business email
- Thank you message

### 9. Footer

- Generation timestamp
- Page numbers (if multi-page)
- Optional: Company website

---

## Technical Implementation Notes

### PDF Generation Flow

1. **Trigger:** Job status changes to "Completed"
2. **API Call:** `POST /api/jobs/[id]/generate-pdf`
3. **Process:**
   - Fetch job data from database
   - Download before/after photos from Supabase Storage
   - Generate PDF using PDFKit
   - Embed images in PDF
   - Add all text content
   - Format according to design
4. **Return:** PDF buffer/stream
5. **Usage:**
   - Attach to completion email
   - OR return as download response

### Image Handling

- Download images from Supabase Storage URLs
- Resize images if too large (max 4" width)
- Maintain aspect ratio
- Compress images for PDF (balance quality/size)
- Handle missing images gracefully

### Text Content

- Escape special characters
- Handle long text (wrap properly)
- Format dates consistently
- Handle missing optional fields

### Error Handling

- If photos fail to load: Show placeholder or skip
- If invoice missing: Show "Invoice will be provided separately"
- If data missing: Show "N/A" or skip section

---

## Example PDF Structure

**Single Page Example (Minimal Data):**

- Header
- Customer Info
- Job Details
- Status
- 1-2 Before Photos
- 1-2 After Photos
- Invoice Info
- Contact Info
- Footer

**Multi-Page Example (Full Data):**

- Page 1: Header, Customer Info, Job Details
- Page 2: Special Requirements, Work Summary
- Page 3: Before Photos (multiple)
- Page 4: After Photos (multiple)
- Page 5: Invoice Info, Contact Info, Footer

---

## Email Integration

### Email Attachment

- PDF generated on-demand
- Attached to completion email
- Filename: `Job-[JobNumber]-Summary-[Date].pdf`
- Example: `Job-JOB-001-Summary-2024-01-15.pdf`

### Email Content

- Subject: "Job [Job Number] Completed - Summary Attached"
- Body: Brief message + PDF attachment
- Invoice: Separate attachment if uploaded file exists

---

## Future Enhancements (Optional)

- Custom branding/logo
- QR code for invoice link
- Digital signature
- Multi-language support
- Custom color themes
- Company letterhead template

---

**Document Version:** 1.0  
**Last Updated:** 2024
