#!/usr/bin/env python3
"""Validate the concealed phase-4 blueprint; print only spoiler-free results."""

import argparse
from copy import deepcopy
from itertools import permutations, product
import json
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = ROOT / "docs/development-spoilers/design/blueprint.json"
RESEARCH = ROOT / "docs/development-spoilers/research/facts.json"


def need(condition, message):
    if not condition:
        raise ValueError(message)


def indexed(records, label):
    need(isinstance(records, list) and records, f"{label}: missing record collection")
    result = {record["id"]: record for record in records}
    need(len(result) == len(records), f"{label}: duplicate IDs")
    return result


def minute(value):
    need(isinstance(value, str) and re.fullmatch(r"\d{2}:\d{2}", value), "Invalid case-time syntax")
    hour, mins = map(int, value.split(":"))
    need(0 <= hour < 24 and 0 <= mins < 60, "Invalid case-time value")
    return 60 * hour + mins


def hhmm(value):
    return f"{value // 60:02d}:{value % 60:02d}"


def validate_records(spec, research):
    need(spec["schema_version"] == 1 and spec["artifact_type"] == "phase_4_design",
         "Unsupported architecture format")
    need(spec["status"] == "design_complete", "Architecture is not marked as a complete design")
    need(spec["runtime_content_complete"] is False and spec["application_implemented"] is False,
         "Design must not claim later-phase content or application implementation")
    chapters = indexed(spec["chapters"], "chapters")
    puzzles = indexed(spec["puzzles"], "puzzles")
    evidence = indexed(spec["evidence"], "evidence")
    assets = indexed(spec["asset_specs"], "assets")
    facts = indexed(research["facts"], "facts")
    sources = indexed(research["sources"], "sources")
    locations = indexed(research["locations"], "locations")
    for fact in facts.values():
        need(fact["verification_status"] in
             {"Verified", "Provisionally Verified", "Unverified", "Rejected"}, "Invalid fact status")
        need(fact["location_id"] is None or fact["location_id"] in locations, "Unknown fact location")
        need(fact["evidence"] and all(item["source_id"] in sources for item in fact["evidence"]),
             "Fact has missing source evidence")
    contract = spec["contracts"]
    for key in ("single_phone", "offline_all_chapters_required", "reveal_confirmation_required",
                "completion_idempotent", "show_relevant_evidence"):
        need(contract[key] is True, f"Required contract missing: {key}")
    for key in ("audio_allowed", "paper_required", "arrival_proof_required", "hints_delayed",
                "assistance_blocks_completion", "reference_reveals_answer"):
        need(contract[key] is False, f"Forbidden gameplay dependency: {key}")
    need(contract["final_submission_field_count"] == 2, "Final submission must remain brief")
    need(spec["route"]["essential_physical_fact_ids"] == [], "This design approves no physical clue")
    need(set(spec["route"]["location_ids"]) <= locations.keys(), "Unknown route location")
    for fact_id in spec["route"]["documentary_fact_ids"]:
        fact = facts[fact_id]
        need(fact["verification_status"] == "Verified" and fact["eligible_as_essential_reference"],
             "Ineligible essential documentary input")
    for fact_id in spec["route"]["navigation_fact_ids"] + spec["route"]["restriction_fact_ids"]:
        need(facts[fact_id]["verification_status"] == "Verified", "Unverified navigation/restriction claim")
    for asset in assets.values():
        need(asset["required_offline"] is True and asset["text_equivalent_required"] is True,
             "Reference assets need offline text equivalents")
        need(asset["image_essential"] is False, "An uninspected image cannot be essential")
        for fact_id in asset["fact_ids"]:
            need(fact_id in spec["route"]["documentary_fact_ids"], "Asset uses unapproved reference fact")
    granted, used_puzzles, used_facts = set(), [], set()
    previous = None
    for chapter in chapters.values():
        expected_chapter_gate = [] if previous is None else [previous]
        need(chapter["prerequisite_puzzle_ids"] == expected_chapter_gate,
             f"{chapter['id']}: invalid chapter gate")
        need(chapter["location_id"] in spec["route"]["location_ids"], "Chapter is outside selected route")
        for puzzle_id in chapter["puzzle_ids"]:
            need(puzzle_id in puzzles and puzzle_id not in used_puzzles, "Unknown or repeated chapter puzzle")
            puzzle = puzzles[puzzle_id]
            need(puzzle["chapter_id"] == chapter["id"] and
                 puzzle["location_id"] == chapter["location_id"], "Puzzle/chapter setting mismatch")
            expected_gate = [] if previous is None else [previous]
            need(puzzle["prerequisite_puzzle_ids"] == expected_gate, f"{puzzle_id}: invalid dependency")
            entry = puzzle["entry_evidence_ids"]
            need(len(entry) == len(set(entry)) and set(entry) <= evidence.keys(), "Invalid entry grant")
            need(not granted.intersection(entry), "Evidence granted prematurely or repeatedly")
            granted.update(entry)
            need(set(puzzle["required_evidence_ids"]) <= granted, f"{puzzle_id}: requires future evidence")
            need(set(puzzle["required_evidence_ids"]) <= set(puzzle["surfaced_evidence_ids"]) <= granted,
                 f"{puzzle_id}: relevant evidence not surfaced or future evidence exposed")
            need(puzzle["required_physical_fact_ids"] == [], "Unapproved essential physical dependency")
            for fact_id in puzzle["essential_fact_ids"]:
                need(fact_id in spec["route"]["documentary_fact_ids"], "Unapproved essential fact")
                used_facts.add(fact_id)
            need(set(puzzle["required_asset_ids"]) <= assets.keys(), "Unknown required asset")
            need(len(puzzle["hints"]) == 3 and all(puzzle["hints"]), "Incomplete progressive assistance")
            need(puzzle["reveal_explanation"] and puzzle["narrative_purpose"] and
                 puzzle["alternative_eliminations"] and puzzle["working_aid"], "Incomplete puzzle specification")
            need(5 <= puzzle["target_minutes"] <= 10 and
                 0 <= puzzle["manipulation_minutes"] <= puzzle["target_minutes"], "Invalid pacing target")
            routes = puzzle["completion_routes"]
            need(set(routes) == {"correct", "reveal"} and routes["correct"] == routes["reveal"],
                 "Correct and reveal must grant identical evidence")
            need(routes["correct"] and len(routes["correct"]) == len(set(routes["correct"])),
                 "Missing or duplicate completion grant")
            for evidence_id in routes["correct"]:
                need(evidence_id in evidence and evidence_id not in granted, "Invalid/premature reward")
                need(set(evidence[evidence_id]["supports_from"]) <= granted, "Conclusion lacks prior support")
                granted.add(evidence_id)
            reference = puzzle["reference_route"]
            for flag in ("requires_visit", "requires_network", "requires_image", "reveals_answer", "completes_puzzle"):
                need(reference[flag] is False, "Reference route requires access or discloses/completes a solution")
            need(set(reference["evidence_ids"]) <= set(entry), "Reference route leaks future evidence")
            used_puzzles.append(puzzle_id)
            previous = puzzle_id
    need(used_puzzles == list(puzzles), "Orphan or out-of-order puzzle")
    need(granted == evidence.keys(), "Orphan evidence or missing grant")
    need(used_facts == set(spec["route"]["documentary_fact_ids"]), "Missing use of approved reference inputs")
    for i, puzzle in enumerate(puzzles.values()):
        expected_next = [] if i == len(puzzles) - 1 else [used_puzzles[i + 1]]
        need(puzzle["unlocks_puzzle_ids"] == expected_next, "Broken completion unlock")
    for record in evidence.values():
        need(record["classification"] in {"fictional", "authored_reference", "mixed_separated"},
             "Evidence must distinguish fiction and facts")
        need(record["required_offline"] and record["text_equivalent_required"], "Evidence unavailable offline as text")
        need(set(record["fact_ids"]) <= facts.keys(), "Unknown evidence fact")
    final_contract = puzzles[used_puzzles[-1]]["final_contract"]
    need(final_contract["atomic_pair_validation"] is True and
         final_contract["per_field_correctness_feedback"] is False and
         final_contract["external_submission"] is False and final_contract["optional_full_explanation"] is True,
         "Unsafe or overlong final-submission contract")
    pacing = spec["pacing"]
    need(sum(p["target_minutes"] for p in puzzles.values()) == pacing["puzzle_minutes"], "Puzzle budget mismatch")
    need(sum(p["manipulation_minutes"] for p in puzzles.values()) == pacing["manipulation_minutes"],
         "Interaction budget mismatch")
    need(sum(pacing[key] for key in ("puzzle_minutes", "travel_minutes", "optional_observation_minutes",
                                   "reading_and_transitions_minutes", "ending_minutes", "contingency_minutes")) ==
         pacing["total_minutes"] == 180, "Core budget does not reconcile")
    need(0.20 <= pacing["manipulation_minutes"] / pacing["puzzle_minutes"] <= 0.30, "Interaction mix outside target")
    need(sum(leg["allocated_minutes"] for leg in spec["route"]["legs"]) == pacing["travel_minutes"],
         "Travel budget mismatch")
    for leg in spec["route"]["legs"]:
        need(leg["after_puzzle_id"] in puzzles and leg["requires_confirmation"] is True,
             "Destination must be confirmed after its gate")
        need(leg["from"] in locations and leg["to"] in locations, "Unknown travel endpoint")
    need((ROOT / spec["route"]["feasibility_record"]).is_file(), "Missing feasible-route record")
    return puzzles, evidence


def validate_paths(puzzles, evidence):
    options = []
    for puzzle in puzzles.values():
        modes = ["correct", "reveal"]
        if puzzle["reference_route"]["optional_observation_choice"]:
            modes += ["reference_correct", "reference_reveal"]
        options.append(modes)
    count = 0
    for choices in product(*options):
        available, completed = set(), set()
        for puzzle, route in zip(puzzles.values(), choices):
            need(set(puzzle["prerequisite_puzzle_ids"]) <= completed, "Assisted path reaches locked objective")
            available.update(puzzle["entry_evidence_ids"])
            before_reference = available.copy()
            if route.startswith("reference_"):
                available.update(puzzle["reference_route"]["evidence_ids"])
                need(available == before_reference, "Reference grants a future reward")
                route = route.removeprefix("reference_")
            need(set(puzzle["required_evidence_ids"]) <= available, "Assisted path loses inputs")
            available.update(puzzle["completion_routes"][route])
            completed.add(puzzle["id"])
            # Repeating the same completion must be set-idempotent in the model.
            once = available.copy()
            available.update(puzzle["completion_routes"][route])
            need(available == once, "Repeated completion changes modeled grants")
        need(available == set(evidence), "An assisted path cannot reach the complete case")
        count += 1
    return count


def solve_models(spec, puzzles):
    model = spec["solution_models"]
    chain, current, seen = model["receipt_chain"], model["receipt_chain"]["root"], set()
    while True:
        need(current not in seen, "P01: cyclic receipt chain")
        seen.add(current)
        links = [edge for edge in chain["edges"] if edge["job"] == chain["job"] and edge["from"] == current]
        need(len(links) <= 1, "P01: ambiguous receipt chain")
        if not links:
            break
        current = links[0]["to"]
    need(current == puzzles["P01"]["canonical_answer"], "P01: answer not supported by receipts")

    causal = model["causal_process"]
    orders = [order for order in permutations(causal["events"]) if
              all(order.index(a) < order.index(b) for a, b in causal["before"])]
    need(len(orders) == 1 and list(orders[0]) == puzzles["P02"]["canonical_answer"]["sequence"],
         "P02: process order not unique or answer incorrect")
    profiles = [profile for profile in causal["bench_profiles"] if
                all(profile[key] == value for key, value in causal["case_observations"].items())]
    need(len(profiles) == 1 and profiles[0]["mechanism"] == puzzles["P02"]["canonical_answer"]["mechanism"],
         "P02: mechanism not uniquely supported")

    cipher = model["cipher"]
    need(len(cipher["alphabet"]) == len(set(cipher["alphabet"])) == 25 and
         cipher["coordinate_order"] == "row_column", "P03: invalid cipher protocol")
    need(set(cipher["keyword"]) <= set(cipher["alphabet"]), "P03: unsupported keyword character")
    grid = "".join(dict.fromkeys(cipher["keyword"] + cipher["alphabet"]))
    decoded = []
    for pair in cipher["pairs"]:
        need(re.fullmatch(r"[1-5]{2}", pair), "P03: malformed cipher pair")
        decoded.append(grid[(int(pair[0]) - 1) * 5 + int(pair[1]) - 1])
    plaintext = "".join(decoded)
    need(plaintext == puzzles["P03"]["canonical_answer"], "P03: cipher answer mismatch")
    selectors = [s for s in cipher["selector_records"] if s["connecting_feature"] == plaintext]
    need(len(selectors) == 1 and selectors[0]["destination_id"] == spec["route"]["legs"][1]["to"] and
         selectors[0]["access"] == "northern_public_approach", "P03: ambiguous/wrong destination selector")

    merge = model["identity_merge"]
    need(merge["retain_original_keys"] is True, "P04: original identities discarded")
    need(len({(row["group"], row["serial"]) for row in merge["inventory"]}) == len(merge["inventory"]),
         "P04: duplicate original identity")
    selected = [row for row in merge["inventory"] if all(row[key] == value for key, value in merge["criteria"].items())]
    payload = {row["serial"] for row in selected}
    need(len(selected) == len(payload) == 2 and payload == set(puzzles["P04"]["canonical_answer"]) and
         {row["group"] for row in selected} == set(merge["groups_before"]), "P04: pair not uniquely supported")
    provenance = model["provenance"]
    commission = provenance["commission"]
    need(set(commission["serials"]) == payload == set(provenance["sale_claim"]["serials"]) and
         commission["batch"] == merge["criteria"]["batch"] and commission["job"] == chain["job"],
         "P05: commission lacks the recovered identity")
    need(commission["manufacture"] == "new" and commission["owner"] in provenance["approved_receivers"] and
         provenance["sale_claim"]["status"] == "claim_under_examination" and
         provenance["supported_classification"] == puzzles["P05"]["canonical_answer"] == "modern commission",
         "P05: classification not supported by signed commission")

    timeline = model["timeline"]
    need(timeline["single_case_day"] is True and timeline["no_drift"] is True, "P06: ambiguous calibration")
    lower = minute(timeline["last_intact_service_time"]) - timeline["clock_minutes_fast"]
    upper = minute(timeline["first_diverted_service_time"]) - timeline["clock_minutes_fast"]
    need(0 <= lower < upper < 1440 and
         [hhmm(lower), hhmm(upper)] == puzzles["P06"]["canonical_answer"], "P06: wrong corrected interval")
    need(puzzles["P06"]["time_bounds"]["lower_inclusive"] is False and
         puzzles["P06"]["time_bounds"]["upper_inclusive"] is True, "P06: wrong interval endpoints")

    roster = model["roster"]
    constraints = roster["constraints"]
    solutions = []
    for role_order, badge_order in product(permutations(roster["roles"]), permutations(roster["badges"])):
        roles = dict(zip(roster["people"], role_order))
        badges = dict(zip(roster["people"], badge_order))
        if any(roles[person] != role for person, role in constraints["person_role"].items()):
            continue
        if any(badges[person] != badge for person, badge in constraints["person_badge"].items()):
            continue
        if any(roles[person] in excluded for person, excluded in constraints["excluded_roles"].items()):
            continue
        if any(badges[person] != constraints["role_badge"][role] for person, role in roles.items()
               if role in constraints["role_badge"]):
            continue
        solutions.append(badges)
    need(len(solutions) == 1 and solutions[0] == puzzles["P07"]["canonical_answer"],
         "P07: roster has no unique supported mapping")
    badges = solutions[0]
    final = model["final"]
    rules = {"complete_relevant_records", "individual_unshared_badges", "no_delegation_impersonation_or_collusion",
             "no_queued_delayed_or_offline_changes", "certified_records_reliable", "actions_take_effect_immediately"}
    need(rules <= final["closed_case_rules"].keys() and
         all(final["closed_case_rules"][key] is True for key in rules), "P08: missing disclosed case rule")
    indexed(final["orders"], "order candidates")
    for interval in final["intervals"]:
        need(interval["badge"] in roster["badges"] and minute(interval["from"]) < minute(interval["until"]),
             "P08: invalid authority interval")
    findings = []
    for person, order in product(roster["people"], final["orders"]):
        issued = minute(order["time"])
        if badges[person] != order["badge"] or set(order["serials"]) != payload:
            continue
        if order["receiver"] in provenance["approved_receivers"] or not lower < issued <= upper:
            continue
        authorized = any(interval["badge"] == order["badge"] and
                         set(final["required_permissions"]) <= set(interval["permissions"]) and
                         minute(interval["from"]) <= issued < minute(interval["until"])
                         for interval in final["intervals"])
        if authorized:
            findings.append({"actor": person, "order": order["id"]})
    need(len(findings) == 1 and findings[0] == puzzles["P08"]["canonical_answer"],
         "P08: final finding is ambiguous or disagrees with case evidence")
    return len(roster["people"]) * len(final["orders"])


def validate(spec, research):
    puzzles, evidence = validate_records(spec, research)
    paths = validate_paths(puzzles, evidence)
    hypotheses = solve_models(spec, puzzles)
    return len(spec["chapters"]), len(puzzles), len(evidence), paths, hypotheses


def negative_checks(spec, research):
    mutations = [
        lambda s, r: s["puzzles"][1]["required_evidence_ids"].append("E17"),
        lambda s, r: s["puzzles"][6]["completion_routes"]["reveal"].remove("E16"),
        lambda s, r: s["puzzles"][1]["reference_route"].update(reveals_answer=True),
        lambda s, r: s["puzzles"][3]["reference_route"]["evidence_ids"].append("E17"),
        lambda s, r: s["contracts"].update(offline_all_chapters_required=False),
        lambda s, r: s["contracts"].update(hints_delayed=True),
        lambda s, r: s["puzzles"][1]["required_physical_fact_ids"].append("F012"),
        lambda s, r: next(f for f in r["facts"] if f["id"] == "F011").update(verification_status="Provisionally Verified"),
        lambda s, r: s["solution_models"]["receipt_chain"]["edges"].append({"job":"LC17","from":"K8","to":"R9"}),
        lambda s, r: s["solution_models"]["causal_process"]["before"].pop(),
        lambda s, r: s["solution_models"]["cipher"].update(coordinate_order="column_row"),
        lambda s, r: s["solution_models"]["identity_merge"]["inventory"][-1].update(kind="relief"),
        lambda s, r: s["solution_models"]["timeline"].update(clock_minutes_fast=3),
        lambda s, r: s["solution_models"]["roster"]["constraints"]["person_role"].pop("Nadia Hart"),
        lambda s, r: s["solution_models"]["final"]["closed_case_rules"].update(individual_unshared_badges=False),
        lambda s, r: s["solution_models"]["final"]["orders"].append(dict(s["solution_models"]["final"]["orders"][2],id="O99")),
        lambda s, r: s["puzzles"][-1]["final_contract"].update(per_field_correctness_feedback=True),
        lambda s, r: s["pacing"].update(total_minutes=181),
    ]
    for number, mutate in enumerate(mutations, start=1):
        candidate, facts = deepcopy(spec), deepcopy(research)
        mutate(candidate, facts)
        try:
            validate(candidate, facts)
        except ValueError:
            continue
        raise ValueError(f"Negative check {number} was not rejected")
    return len(mutations)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="also reject deliberate invalid design mutations")
    args = parser.parse_args()
    try:
        spec = json.loads(BLUEPRINT.read_text(encoding="utf-8"))
        research = json.loads(RESEARCH.read_text(encoding="utf-8"))
        chapters, puzzles, evidence, paths, hypotheses = validate(spec, research)
        negative = negative_checks(spec, research) if args.self_test else 0
    except (OSError, ValueError, KeyError, TypeError, IndexError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1
    print(f"PASS: {chapters} chapters, {puzzles} puzzles, {evidence} evidence records; dependency and fact checks.")
    print(f"PASS: {paths} modeled correct/reveal/reference completion paths preserve the complete case.")
    print(f"PASS: all eight solution models; unique roster and one final finding among {hypotheses} candidates.")
    print("PASS: single 180-minute design budget; 25% of solving time allocated to manipulation.")
    if negative:
        print(f"PASS: {negative} deliberate invalid mutations rejected.")
    print("Scope: architecture consistency only; content, app, device, timing and field tests remain later work.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
