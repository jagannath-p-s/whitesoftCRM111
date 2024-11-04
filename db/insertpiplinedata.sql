INSERT INTO "public"."pipelines" ("pipeline_id", "pipeline_name", "created_at") VALUES ('23', 'SMAM', '2024-07-27 11:35:17.708305'), ('24', 'Irrigation subsidy', '2024-07-27 11:35:36.124912'), ('27', 'Ksheerasree', '2024-07-30 11:34:47.385022'), ('28', 'General Subsidy', '2024-07-30 11:35:41.139828'), ('29', 'Sale', '2024-07-30 11:36:04.428307');

INSERT INTO "public"."pipeline_stages" ("stage_id", "pipeline_id", "stage_name", "created_at") VALUES ('42', '23', 'Doc Collection', '2024-08-07 06:04:14.842067'), ('43', '23', 'Registration', '2024-08-07 06:08:41.32597'), ('44', '23', 'Product Selected', '2024-08-07 06:12:07.02802'), ('45', '23', 'Approved', '2024-08-07 06:13:08.635614'), ('46', '23', 'Product Finalization', '2024-08-07 06:22:25.409626'), ('47', '23', 'Supply', '2024-08-07 06:29:04.199742'), ('48', '23', 'Bill Updation', '2024-08-07 06:30:23.45624'), ('49', '23', 'Manufacture', '2024-08-07 06:31:33.27924'), ('51', '24', 'Site Visit', '2024-10-15 09:50:46.079098'), ('52', '24', 'quotation', '2024-10-15 09:51:12.270612'), ('53', '24', 'Work order', '2024-10-15 09:51:20.525922'), ('54', '24', 'Payment', '2024-10-15 09:51:43.423806'), ('55', '24', 'Material Supply', '2024-10-15 09:52:43.305029'), ('56', '24', 'Trenching', '2024-10-15 09:53:23.103852'), ('57', '24', 'Work Completed', '2024-10-15 09:53:33.809137'), ('59', '24', 'Bill Submitted', '2024-10-15 09:54:53.894827'), ('60', '27', 'Quotation', '2024-10-15 09:55:36.380589'), ('61', '27', 'Supply', '2024-10-15 09:55:46.604074');

INSERT INTO "public"."pipeline_fields" ("field_id", "stage_id", "field_name", "field_type", "created_at") VALUES ('43', '42', 'Aadhar', 'checkbox', '2024-08-07 06:06:00.25119'), ('44', '42', 'Passbook', 'checkbox', '2024-08-07 06:06:11.904393'), ('45', '42', 'land receipt', 'checkbox', '2024-08-07 06:06:28.301674'), ('46', '42', 'Photo', 'checkbox', '2024-08-07 06:06:44.028108'), ('47', '42', 'Pan', 'checkbox', '2024-08-07 06:07:05.232352'), ('48', '43', 'Completed', 'checkbox', '2024-08-07 06:11:33.69286'), ('49', '44', 'Waiting No.', 'textfield', '2024-08-07 06:12:27.086731'), ('50', '44', 'Remark', 'textfield', '2024-08-07 06:12:50.700312'), ('51', '45', 'Pass Date', 'date', '2024-08-07 06:17:53.388931'), ('53', '46', 'Dealer Selection', 'checkbox', '2024-08-07 06:28:18.237748'), ('54', '46', 'Date', 'date', '2024-08-07 06:28:43.766568'), ('56', '47', 'date', 'date', '2024-08-07 06:30:12.823025'), ('57', '47', 'Remark', 'textfield', '2024-08-07 06:30:46.780401'), ('58', '48', 'Date', 'date', '2024-08-07 06:31:04.37902'), ('59', '48', 'Remark', 'textfield', '2024-08-07 06:31:04.567678'), ('60', '49', 'Approval date', 'date', '2024-08-07 06:31:51.727391'), ('67', '43', 'Remark', 'textfield', '2024-10-15 07:03:55.122324'), ('68', '45', 'Remark', 'textfield', '2024-10-15 07:04:22.744932'), ('69', '46', 'Remark', 'textfield', '2024-10-15 07:04:44.58002'), ('70', '49', 'Remark', 'textfield', '2024-10-15 07:06:09.969067'), ('75', '53', 'Remark', 'textfield', '2024-10-15 09:51:29.192567'), ('76', '54', 'Yes', 'checkbox', '2024-10-15 09:51:51.96358'), ('77', '54', 'No', 'checkbox', '2024-10-15 09:51:57.936752'), ('79', '54', 'Date', 'date', '2024-10-15 09:52:15.034759'), ('80', '54', 'Remark', 'textfield', '2024-10-15 09:52:25.282632'), ('81', '57', 'Remark', 'textfield', '2024-10-15 09:53:40.908637'), ('82', '56', 'Remark', 'textfield', '2024-10-15 09:53:48.324278'), ('83', '59', 'Date', 'date', '2024-10-15 09:55:02.430978'), ('84', '59', 'Remark', 'textfield', '2024-10-15 09:55:09.289019'), ('85', '60', 'Remark', 'textfield', '2024-10-15 09:55:55.980112'), ('86', '61', 'Remark', 'textfield', '2024-10-15 09:56:09.050406');