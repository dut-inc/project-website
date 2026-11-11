"""Tests for the Law of Root extractor.

    .venv/Scripts/python -m unittest scripts/root/test_extract_law.py -v

The whole-book tests parse public/data/root/Root_2025_Law.pdf and pin facts
checked by hand against that PDF. Update them deliberately if the PDF changes.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import extract_law as ex  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
PDF = ROOT / "public" / "data" / "root" / "Root_2025_Law.pdf"


class HelperTests(unittest.TestCase):
    def test_number_to_id(self):
        self.assertEqual(ex.number_to_id("rule", "6.2.3"), "rule-6-2-3")
        self.assertEqual(ex.number_to_id("rule", "4.3.5.II"), "rule-4-3-5-ii")
        self.assertEqual(ex.number_to_id("rule", "9.2.9.IIIa"), "rule-9-2-9-iii-a")
        self.assertEqual(ex.number_to_id("rule", "G.20"), "rule-g-20")
        self.assertEqual(ex.number_to_id("section", "A.5"), "section-a-5")

    def test_cross_references(self):
        f = ex.find_cross_references
        self.assertEqual(f("as defined in the Glossary (G.20, G.24)."), ["G.20", "G.24"])
        self.assertEqual(f("resolve 4.3.1.I–II in order."), ["4.3.1.I", "4.3.1.II"])
        self.assertEqual(f("homeland, A.8.3.I–III"), ["A.8.3.I", "A.8.3.II", "A.8.3.III"])
        self.assertEqual(f("into a Hostile clearing (9.2.9.IIIb)."), ["9.2.9.IIIb"])
        self.assertEqual(f("See 1.1.2."), ["1.1.2"])
        self.assertEqual(f("hirelings (Appendix H)"), ["H"])
        self.assertEqual(f("the faction they choose in setup (5) and"), ["5"])
        self.assertEqual(f("score 30 victory points, 5/2 reach"), [])

    def test_render_segments(self):
        S = ex.Segment
        text = ex.render_segments(
            [
                S("plain", "cannot. "),
                S("italic", "(Pieces may be moved into it."),
                S("plain", " "),
                S("italic", "If the keep is re­"),
                S("italic", "moved.)"),
                S("plain", " Take 2 "),
                S("item", "boots"),
                S("plain", "."),
            ]
        )
        self.assertEqual(
            text, "cannot. *(Pieces may be moved into it. If the keep is removed.)* Take 2 {item:boots}."
        )

    def test_plain_text(self):
        self.assertEqual(ex.plain_text("Take *one* {item:sword}."), "Take one sword.")

    def test_join_needs_space(self):
        self.assertTrue(ex.join_needs_space("word"))
        self.assertFalse(ex.join_needs_space("fol­"))
        self.assertFalse(ex.join_needs_space("non-"))
        self.assertFalse(ex.join_needs_space("ends with space "))


@unittest.skipUnless(PDF.exists(), "source PDF not present")
class WholeBookTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _, cls.sections, cls.rules, cls.factions, cls.report = ex.extract(PDF, "2025-10-13")
        cls.by_id = {r["id"]: r for r in cls.rules}
        cls.sections_by_id = {s["id"]: s for s in cls.sections}

    def test_every_character_accounted_for(self):
        self.assertTrue(self.report["conservation"]["ok"], self.report["conservation"])

    def test_report_is_clean(self):
        self.assertEqual(self.report["duplicate_ids"], [])
        self.assertEqual(self.report["numbering_gaps"], [])
        self.assertEqual(self.report["unresolved_cross_references"], [])
        self.assertEqual(self.report["unknown_item_glyphs"], {})
        self.assertEqual(self.report["warnings"], [])

    def test_counts(self):
        # 454 X.Y.Z numbers + 36 glossary entries = the 490 6pt rule numbers in the PDF.
        by_type = self.report["counts"]["by_type"]
        self.assertEqual(by_type["rule"], 454)
        self.assertEqual(by_type["glossary"], 36)
        self.assertEqual(by_type["sub-rule"], 135)

    def test_factions(self):
        names = [f["name"] for f in self.factions]
        self.assertEqual(len(names), 13)
        self.assertEqual(names[0], "Marquise de Cat")
        self.assertEqual(names[-1], "Knaves of the Deepwood")
        by_name = {f["name"]: f for f in self.factions}
        self.assertIsNone(by_name["Vagabond"]["expansion"])
        self.assertEqual(by_name["Lizard Cult"]["expansion"], "The Riverfolk Expansion")
        self.assertEqual(by_name["Twilight Council"]["expansion"], "The Homeland Expansion")

    def test_sections_under_their_chapter(self):
        for s in self.sections:
            if s["level"] == 2:
                chapter = "section-" + s["number"].split(".")[0].lower()
                self.assertEqual(s["parent_section_id"], chapter, s["id"])

    def test_rules_in_book_order(self):
        orders = [r["order"] for r in self.rules]
        self.assertEqual(orders, sorted(orders))
        ids = [r["id"] for r in self.rules]
        # Page 5 prints 5.1 in the left column and 6 (Marquise) in the right.
        self.assertLess(ids.index("rule-5-2"), ids.index("rule-6-1"))
        # M.5 (page 28, left column) comes before V (page 28, right column).
        self.assertLess(ids.index("rule-m-5-1"), ids.index("rule-v-1-1"))

    def test_known_rule(self):
        r = self.by_id["rule-6-2-3"]
        self.assertEqual(r["rule_number"], "6.2.3")
        self.assertEqual(r["title"], "Field Hospitals")
        self.assertTrue(r["text"].startswith("Whenever any number of Marquise warriors are removed"))
        self.assertEqual(r["faction_ids"], ["marquise-de-cat"])
        self.assertEqual(r["source_page_start"], 5)

    def test_sub_rules_link_to_parent(self):
        self.assertEqual(self.by_id["rule-4-3-5-ii"]["parent_rule_id"], "rule-4-3-5")
        self.assertEqual(self.by_id["rule-9-2-9-iii-a"]["parent_rule_id"], "rule-9-2-9-iii")

    def test_faction_icon_markers(self):
        self.assertEqual(
            self.by_id["rule-4-2-1"]["faction_markers"],
            ["vagabond", "riverfolk-company", "corvid-conspiracy", "lilypad-diaspora", "knaves-of-the-deepwood"],
        )

    def test_item_icons(self):
        self.assertIn("2 {item:boots}, 2 {item:bag}, 1 {item:crossbow}", self.by_id["rule-5-1-5"]["text"])
        self.assertEqual(self.by_id["rule-18-5-1-iv-a"]["title"], "Dash ({item:boots})")

    def test_cross_references_resolve(self):
        refs = self.by_id["rule-4-3-1"]["cross_references"]
        self.assertEqual([x["target_id"] for x in refs], ["rule-4-3-1-i", "rule-4-3-1-ii"])

    def test_rule_split_across_columns_has_two_locations(self):
        locs = self.by_id["rule-2-2-4"]["source_locations"]
        self.assertEqual([l["page"] for l in locs], [3, 3])
        self.assertLess(locs[0]["bbox"][2], 315)
        self.assertGreater(locs[1]["bbox"][0], 315)

    def test_flagged_layouts(self):
        self.assertEqual(self.report["tables"], ["rule-5-2"])
        self.assertEqual(
            self.report["inline_icons"], ["rule-h-2-1", "rule-h-2-2", "rule-h-2-3", "rule-h-2-4"]
        )
        self.assertIn("Vagabond (first/second) | 5/2", self.by_id["rule-5-2"]["text"])


if __name__ == "__main__":
    unittest.main()
