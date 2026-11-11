"""Content contract regressions. Run with: python3 -m unittest discover -s tests -v

Names/output are spoiler-free. Spoiler-bearing reasoning belongs in the separate
development record. This suite does not claim browser or iPhone app coverage.
"""

from copy import deepcopy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from content_answers import check_answer, parse_time
import validate_content as content


class ContentContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.corpus = content.load_corpus()

    def check_cases(self, pid, accepted, rejected):
        solution = self.corpus['solutions'][pid]
        for i, payload in enumerate(accepted):
            with self.subTest(objective=pid, valid=True, case=i):
                self.assertTrue(check_answer(solution, payload))
        for i, payload in enumerate(rejected):
            with self.subTest(objective=pid, valid=False, case=i):
                self.assertFalse(check_answer(solution, payload))

    def test_reference_id_contract(self):
        self.check_cases('P01', ['R1','r-1',' R 1 ','reference 1','REFERENCE-1','Ｒ１'],
                         ['K8','R9','not R1','R1 R9','R11','R1 / R9','1',None,False,[]])

    def test_causal_answer_is_atomic(self):
        answer = self.corpus['solutions']['P02']['canonical']
        accepted = [dict(sequence=answer['sequence'],mechanism=v) for v in
                    ['support withdrawal','Support-withdrawal!','support removal','cradle removal','removed support']]
        rejected = [dict(sequence=answer['sequence'][::-1],mechanism='support withdrawal'),
                    dict(sequence=answer['sequence'],mechanism='impact'),
                    dict(sequence=answer['sequence'],mechanism='not support withdrawal'),
                    dict(sequence=answer['sequence'][:2],mechanism='support withdrawal'),
                    dict(answer,extra='yes'), 'support withdrawal', None]
        self.check_cases('P02',accepted,rejected)

    def test_decoded_literal_does_not_accept_synonyms_or_substrings(self):
        self.check_cases('P03',['SHALLOW',' shallow! ','ＳＨＡＬＬＯＷ'],
                         ['not shallow','shallower','shallow water','s.h.a.l.l.o.w','REF-B','',None])

    def test_serials_are_unordered_distinct_and_complete(self):
        self.check_cases('P04',[['K4','M7'],['m-7','k 4'],['Ｍ７','Ｋ４']],
                         [['K4'],['K4','K4'],['K4','M7','T9'],['K4','T9'],['M7','R2'],['K4','not M7'], 'K4 M7', None])

    def test_classification_variants(self):
        self.check_cases('P05',['modern commission',' Modern-commission! ','new commission','contemporary commission','newly commissioned panels'],
                         ['not modern commission','historic civic salvage','unknown','old modern commission','modern',None])

    def test_time_formats_and_interval_bounds(self):
        self.check_cases('P06', [
            ['15:02','15:10'], '15:02–15:10', '3:02–3:10 PM', '3:02 pm to 3:10 pm',
            {'lower':'3:02','upper':'3:10 p.m.'}, {'lower':'15:02','upper':'15:10'}
        ], [
            '15:06–15:14', '15:10–15:02', '3:02–3:10', '15:02–15:11',
            '3:02 AM–3:10 PM','15:62–15:10','25:02–15:10','15:02 PM–15:10 PM',
            '15:02–15:10 or 15:11', ['15:02'], ['15:02','15:10','15:12'], None,
            {'lower':'15:02','upper':'15:10','inclusive':True}
        ])
        self.assertEqual(self.corpus['solutions']['P06']['timeBounds'],dict(lowerInclusive=False,upperInclusive=True))
        for i, invalid in enumerate(['0:10 AM','13:02 PM','12:60','24:00','15.02','15:02 nonsense','15:2']):
            with self.subTest(invalid_time_case=i):
                with self.assertRaises(ValueError):
                    parse_time(invalid)

    def test_roster_checks_entire_bijection(self):
        canonical = self.corpus['solutions']['P07']['canonical']
        variant = {k:v.lower() for k,v in canonical.items()}
        swapped = dict(canonical)
        keys=list(swapped)
        swapped[keys[0]],swapped[keys[1]]=swapped[keys[1]],swapped[keys[0]]
        missing=dict(canonical); missing.pop(keys[0])
        duplicate=dict(canonical); duplicate[keys[0]]=duplicate[keys[1]]
        self.check_cases('P07',[canonical,variant],[swapped,missing,duplicate,dict(canonical,extra='A7'),None])

    def test_final_pair_requires_both_fields(self):
        self.check_cases('P08',[
            {'actor':'Quinn Arden','order':'O43'}, {'actor':'quinn','order':'O-43'},
            {'actor':' QUINN ARDEN! ','order':'order 43'}, {'actor':'Ｑｕｉｎｎ','order':'43'}
        ], [
            {'actor':'Quinn','order':'O26'},{'actor':'Samir Cole','order':'O43'},
            {'actor':'not Quinn','order':'O43'},{'actor':'Quinn','order':'043'},
            {'actor':'Quinn','order':'stop O43'},{'actor':'Quinn','order':'O43 and O26'},
            {'actor':'Quinn','order':'O43','reason':'extra'}, {'actor':'Quinn'},None
        ])

    def test_actual_player_tables_support_unique_answers(self):
        content.solve_authored_inputs(self.corpus)

    def test_finite_solvers_reject_ambiguous_authored_inputs(self):
        mutations=[
            lambda c: content.block(c,'E16#orders')['rows'].append(dict(content.block(c,'E16#orders')['rows'][2],id='O99')),
            lambda c: content.block(c,'E03#profiles')['rows'].append(dict(content.block(c,'E03#profiles')['rows'][2],mechanism='different profile')),
            lambda c: content.block(c,'E08#before')['rows'].append(dict(group='A',serial='Z1',owner='Lark Workshop',kind='relief',batch='B17')),
            lambda c: content.block(c,'E01#receipts')['rows'].append(dict(job='LC17',**{'from':'H0','to':'Q3'})),
            lambda c: content.block(c,'E12#log')['rows'][1].__setitem__('serviceTime','15:15'),
        ]
        for i, mutate in enumerate(mutations):
            with self.subTest(mutation=i):
                changed=deepcopy(self.corpus); mutate(changed)
                with self.assertRaises(ValueError):
                    content.solve_authored_inputs(changed)

    def test_corrupt_or_incomplete_local_package_fails(self):
        # Exercise the real inventory checker in an isolated copy; no working
        # files are removed or modified. Later-chapter loss must be detected.
        for i, mode in enumerate(('missing_asset','changed_later_document','unlisted_file','truncated_solution')):
            with self.subTest(package_case=i), tempfile.TemporaryDirectory() as directory:
                copy=Path(directory)
                for folder in ('site','scripts'):
                    shutil.copytree(ROOT/folder,copy/folder,ignore=shutil.ignore_patterns('__pycache__'))
                if mode=='missing_asset':
                    (copy/'site/assets/references/r04.svg').unlink()
                elif mode=='changed_later_document':
                    path=copy/'site/content/evidence/e16.json'
                    path.write_text(path.read_text()+' ')
                elif mode=='unlisted_file':
                    (copy/'site/content/unlisted.json').write_text('{}')
                else:
                    (copy/'site/content/solutions/p08.json').write_text('{')
                result=subprocess.run([sys.executable,str(copy/'scripts/build_content_inventory.py'),'--check'],capture_output=True,text=True)
                self.assertNotEqual(result.returncode,0)


if __name__=='__main__':
    unittest.main()
