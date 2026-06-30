// Generated from ClisTa-Protocol examples/manifest.json entry "pharma-phase-gate-multithreaded".
// Do not edit by hand — run `npm run sync:examples`.
export const example = {
  "id": "pharma-phase-gate-multithreaded",
  "title": "Pharma Phase II/III Go/No-Go — Multi-Arm (Octopus)",
  "summary": "A parent go/no-go that imports four arm-level decisions as CrossThreadEvidence. Two objections (safety stopping rules, subgroup discipline) and a biostatistician minority report propagate from the arms and survive the parent approval — traceable two threads deep by hash.",
  "kind": "multi-thread",
  "domain": "pharma",
  "entryThreadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
  "threads": [
    {
      "role": "parent",
      "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_cmo_mqzxqcbk_dffd01b1",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.716Z",
          "payload": {
            "participant": {
              "id": "par_cmo",
              "object": "participant",
              "kind": "human",
              "name": "Dr. R. Vasquez",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:a066665dd36baa9cee0447c5750d185da12732eab59f0e2334448ed2ff81b2ec"
        },
        {
          "event_id": "evt_participantadded_par_biostat_mqzxqcbk_1ff2d00c",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.738Z",
          "payload": {
            "participant": {
              "id": "par_biostat",
              "object": "participant",
              "kind": "human",
              "name": "Dr. K. Liang",
              "role": "lead biostatistician"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:a066665dd36baa9cee0447c5750d185da12732eab59f0e2334448ed2ff81b2ec",
          "content_hash": "sha256:d47507a6084803850ca42b36e5a11acf49ba781d1c6329435e2b83996226a223"
        },
        {
          "event_id": "evt_participantadded_par_clin_pharm_mqzxqcbk_9ea8d120",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:01.760Z",
          "payload": {
            "participant": {
              "id": "par_clin_pharm",
              "object": "participant",
              "kind": "human",
              "name": "Dr. A. Osei",
              "role": "clinical pharmacologist"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:d47507a6084803850ca42b36e5a11acf49ba781d1c6329435e2b83996226a223",
          "content_hash": "sha256:0b7171fef28d997a7d376aa40b153c44fdf3b7c9812800c4e7b825a05bbdd7f4"
        },
        {
          "event_id": "evt_participantadded_par_reg_affairs_mqzxqcbk_15ea8572",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.782Z",
          "payload": {
            "participant": {
              "id": "par_reg_affairs",
              "object": "participant",
              "kind": "human",
              "name": "J. Markova",
              "role": "vp regulatory affairs"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0b7171fef28d997a7d376aa40b153c44fdf3b7c9812800c4e7b825a05bbdd7f4",
          "content_hash": "sha256:7da985f1da571ab48d87515b70c6c9edf5f1b66a55298330633c4276a4c98676"
        },
        {
          "event_id": "evt_participantadded_par_safety_officer_mqzxqcbk_c8283680",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:01.804Z",
          "payload": {
            "participant": {
              "id": "par_safety_officer",
              "object": "participant",
              "kind": "human",
              "name": "Dr. T. Nakamura",
              "role": "drug safety officer"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:7da985f1da571ab48d87515b70c6c9edf5f1b66a55298330633c4276a4c98676",
          "content_hash": "sha256:75758b89f36dc91c46ce80bbc730ad69b0a1d1fd06168a6309ac4c1f3349851c"
        },
        {
          "event_id": "evt_participantadded_par_octopus_mqzxqcbk_6961727e",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:01.826Z",
          "payload": {
            "participant": {
              "id": "par_octopus",
              "object": "participant",
              "kind": "agent",
              "name": "Octopus",
              "role": "execution orchestrator"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:75758b89f36dc91c46ce80bbc730ad69b0a1d1fd06168a6309ac4c1f3349851c",
          "content_hash": "sha256:cc3a4019996506bd9dae3e1ed4d342e404715de4cfb442734f00b9ebab4e2a6f"
        },
        {
          "event_id": "evt_threadcreated_thd_phase2_to_phase3_go_nogo_ltn4481_mqzxqcbk_d3ff8674",
          "event_type": "ThreadCreated",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.848Z",
          "payload": {
            "thread": {
              "id": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "object": "thread",
              "title": "Phase II/III Go/No-Go — LTN-4481 (Moderate-to-Severe Ulcerative Colitis)",
              "question": "Should LTN-4481 advance from Phase II to Phase III based on arm-level workstream outputs?",
              "status": "active",
              "participantIds": [
                "par_cmo",
                "par_biostat",
                "par_clin_pharm",
                "par_reg_affairs",
                "par_safety_officer",
                "par_octopus"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:cc3a4019996506bd9dae3e1ed4d342e404715de4cfb442734f00b9ebab4e2a6f",
          "content_hash": "sha256:678b168ca721b83811b01b085bf677e6f169bee2618dc44f4809d72982c46a23"
        },
        {
          "event_id": "evt_delegationgranted_dlg_pkpd_mqzxqcbk_aa98c04a",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.870Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_pkpd",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "pkpd-modeling",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute PK/PD modeling arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:01.892Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:678b168ca721b83811b01b085bf677e6f169bee2618dc44f4809d72982c46a23",
          "content_hash": "sha256:9d8a72def614e4d98a3b6bbbc82833c0c94997b25968dcffa128c0fbbcda56e6"
        },
        {
          "event_id": "evt_delegationgranted_dlg_safety_mqzxqcbk_083ca0c2",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.914Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_safety",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "safety-signal-assessment",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute safety signal assessment arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:01.936Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9d8a72def614e4d98a3b6bbbc82833c0c94997b25968dcffa128c0fbbcda56e6",
          "content_hash": "sha256:b215b3050d480535e40bbce1d9a26ed2098c443e294c8af2a3e1d89dc71fe0ed"
        },
        {
          "event_id": "evt_delegationgranted_dlg_subgroup_mqzxqcbk_64538149",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.958Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_subgroup",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "subgroup-analysis-review",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute subgroup analysis review arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:01.980Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:b215b3050d480535e40bbce1d9a26ed2098c443e294c8af2a3e1d89dc71fe0ed",
          "content_hash": "sha256:eaab6b6ede487c88d05ffd4c8b148801f844da6b29221b6222414007259fe1ff"
        },
        {
          "event_id": "evt_delegationgranted_dlg_reg_mqzxqcbk_0532158b",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.002Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_reg",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "regulatory-strategy",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "summary": "Octopus delegated to execute regulatory strategy arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:02.024Z",
              "expiresAt": null,
              "attributionRequired": true,
              "authoritySurrender": false,
              "authorityTransfer": false,
              "automaticConsensus": false,
              "delegatedConsensus": false,
              "delegationWithoutAttribution": false,
              "governanceMutation": false,
              "implicitGovernanceChange": false,
              "permanentAuthorityTransfer": false,
              "unboundedAction": false
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:eaab6b6ede487c88d05ffd4c8b148801f844da6b29221b6222414007259fe1ff",
          "content_hash": "sha256:e124d89311acda447b5c951b7ceb205730316e9f92eda36707916b98f1ebc9a2"
        },
        {
          "event_id": "evt_executionstarted_exe_pkpd_mqzxqcbk_7e7a20d7",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.046Z",
          "payload": {
            "executionRecord": {
              "id": "exe_pkpd",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_pkpd"
              },
              "decisionId": null,
              "actionType": "pkpd-modeling",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.068Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_pkpd"
                },
                "delegationId": "dlg_pkpd",
                "decisionId": null
              },
              "delegationId": "dlg_pkpd"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e124d89311acda447b5c951b7ceb205730316e9f92eda36707916b98f1ebc9a2",
          "content_hash": "sha256:1c9a304a16cfe544c625fb365b805430819013190041877103e8579865ad13f1"
        },
        {
          "event_id": "evt_executionstarted_exe_safety_mqzxqcbk_9a848a58",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.090Z",
          "payload": {
            "executionRecord": {
              "id": "exe_safety",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_safety"
              },
              "decisionId": null,
              "actionType": "safety-signal-assessment",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.112Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_safety"
                },
                "delegationId": "dlg_safety",
                "decisionId": null
              },
              "delegationId": "dlg_safety"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:1c9a304a16cfe544c625fb365b805430819013190041877103e8579865ad13f1",
          "content_hash": "sha256:0ebebde7c7aea91324b430d2cbdf779fcbfc17aa69b949505db99edbe68df22a"
        },
        {
          "event_id": "evt_executionstarted_exe_subgroup_mqzxqcbk_06f403d9",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.134Z",
          "payload": {
            "executionRecord": {
              "id": "exe_subgroup",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_subgroup"
              },
              "decisionId": null,
              "actionType": "subgroup-analysis-review",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.156Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_subgroup"
                },
                "delegationId": "dlg_subgroup",
                "decisionId": null
              },
              "delegationId": "dlg_subgroup"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0ebebde7c7aea91324b430d2cbdf779fcbfc17aa69b949505db99edbe68df22a",
          "content_hash": "sha256:24197e12e1f79ec6d935193cb0e41d7c9bcfd5c01207a02bf1d262d2333f9544"
        },
        {
          "event_id": "evt_executionstarted_exe_reg_mqzxqcbk_0d9765b7",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.178Z",
          "payload": {
            "executionRecord": {
              "id": "exe_reg",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_reg"
              },
              "decisionId": null,
              "actionType": "regulatory-strategy",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.200Z",
              "attribution": {
                "actorId": "par_octopus",
                "authorizationRef": {
                  "type": "delegation",
                  "id": "dlg_reg"
                },
                "delegationId": "dlg_reg",
                "decisionId": null
              },
              "delegationId": "dlg_reg"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:24197e12e1f79ec6d935193cb0e41d7c9bcfd5c01207a02bf1d262d2333f9544",
          "content_hash": "sha256:80033a1696fe97461f55cd0c495b06d88d502ac3ec6de07b503f89798288156a"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_pkpd_output_mqzxqcbl_994d1b85",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:02.222Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_pkpd_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_pkpd_modeling_ltn4481",
              "sourceDecisionRecordId": "dcr_pkpd_dose_confirmed",
              "sourceEventHash": "sha256:a2201a26d69fac1b0206e3a53cf6c4b4eea323e3a377b61865f2f0852124093c",
              "derivation": "decision_output",
              "finding": "200mg Q4W dose confirmed by exposure-response modeling. Cmin correlates with endoscopic improvement (R-squared 0.71). Early PK sampling at weeks 4 and 12 required. Dose adjustment pathway triggers if observed exposure deviates more than 30 percent from model prediction.",
              "confidence": 0.84,
              "committedByParticipantId": "par_clin_pharm",
              "committedAt": "2026-06-29T09:00:02.222Z",
              "contentHash": "sha256:cte_cte_pkpd_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:80033a1696fe97461f55cd0c495b06d88d502ac3ec6de07b503f89798288156a",
          "content_hash": "sha256:4dafbe75e8ea60655a44715675e6a93211466f45161b431ad572f996e05c6dec"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_safety_output_mqzxqcbl_046d2052",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.244Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_safety_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_safety_assessment_ltn4481",
              "sourceDecisionRecordId": "dcr_safety_acceptable",
              "sourceEventHash": "sha256:2208d49917c919cdb518a754e6f53534b173a38002bb29e41cd160fff73d80c8",
              "derivation": "decision_output",
              "finding": "Safety profile acceptable for Phase III with three hard-gated conditions: baseline ALT greater than 2x ULN exclusion, biweekly ALT/AST monitoring for 12 weeks, and quantitative hepatic stopping rules finalized before first patient dosed. Stopping rules condition is a preserved objection from the safety arm.",
              "confidence": 0.79,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:02.244Z",
              "contentHash": "sha256:cte_cte_safety_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4dafbe75e8ea60655a44715675e6a93211466f45161b431ad572f996e05c6dec",
          "content_hash": "sha256:c9d43163f6d531da680c46e5176a4051c7b20f44c40678273fb5653506243aaf"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_safety_objection_mqzxqcbl_3e881fc8",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.266Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_safety_objection",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_safety_assessment_ltn4481",
              "sourceDecisionRecordId": "dcr_safety_acceptable",
              "sourceEventHash": "sha256:2208d49917c919cdb518a754e6f53534b173a38002bb29e41cd160fff73d80c8",
              "derivation": "preserved_objection",
              "finding": "Hepatic stopping rules must be finalized before first patient dosed. Monitoring without quantitative stopping criteria is not a safety plan. This objection survived the arm-level decision and propagates to the parent.",
              "confidence": 0.91,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:02.266Z",
              "contentHash": "sha256:cte_cte_safety_objection"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c9d43163f6d531da680c46e5176a4051c7b20f44c40678273fb5653506243aaf",
          "content_hash": "sha256:d62a611e6a644dfb2702775d9905e1d1b3cbbe1feea90811ae043d9a78b5c579"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_subgroup_output_mqzxqcbl_402a34b0",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.288Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_subgroup_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_subgroup_review_ltn4481",
              "sourceDecisionRecordId": "dcr_subgroup_exploratory",
              "sourceEventHash": "sha256:1260ada0d7cbccf8b9507e88dca27958dd7741de2f5c335fe7500d1f115011b7",
              "derivation": "decision_output",
              "finding": "Bio-failure subgroup designated exploratory only. No alpha allocation, no enrichment, no stratification in Phase III primary analysis. Lead biostatistician filed proactive minority report documenting risk of organizational pressure to promote the finding.",
              "confidence": 0.72,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:02.288Z",
              "contentHash": "sha256:cte_cte_subgroup_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:d62a611e6a644dfb2702775d9905e1d1b3cbbe1feea90811ae043d9a78b5c579",
          "content_hash": "sha256:ad0c1b850b8cec52d086791584c51c1053264e89ea57681082e09b01e4e8e861"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_subgroup_minority_mqzxqcbl_bde39db6",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.310Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_subgroup_minority",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_subgroup_review_ltn4481",
              "sourceDecisionRecordId": "dcr_subgroup_exploratory",
              "sourceEventHash": "sha256:1260ada0d7cbccf8b9507e88dca27958dd7741de2f5c335fe7500d1f115011b7",
              "derivation": "minority_report",
              "finding": "Biostatistician minority report: any future protocol amendment promoting the bio-failure subgroup from exploratory to confirmatory was flagged as a statistical integrity risk at the earliest decision point. Traceable for TMF.",
              "confidence": 0.95,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:02.310Z",
              "contentHash": "sha256:cte_cte_subgroup_minority"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ad0c1b850b8cec52d086791584c51c1053264e89ea57681082e09b01e4e8e861",
          "content_hash": "sha256:8c4d26e7ebc8810d760e5b9a2e81d8f041c5c201ecdeaa4007ca108384037f87"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_reg_output_mqzxqcbl_da0ad77b",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:02.332Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_reg_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "sourceThreadId": "thd_arm_regulatory_strategy_ltn4481",
              "sourceDecisionRecordId": "dcr_reg_strategy_confirmed",
              "sourceEventHash": "sha256:e279fa9b444d03b89d640a41cafc866ebbdde4dc242ee7022f629ef8e7f27a2c",
              "derivation": "decision_output",
              "finding": "Single pivotal trial strategy confirmed. Adaptive design with interim futility, at least 500 patients, hepatic monitoring plan per FDA Type B meeting alignment. IND amendment to reference meeting minutes.",
              "confidence": 0.95,
              "committedByParticipantId": "par_reg_affairs",
              "committedAt": "2026-06-29T09:00:02.332Z",
              "contentHash": "sha256:cte_cte_reg_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8c4d26e7ebc8810d760e5b9a2e81d8f041c5c201ecdeaa4007ca108384037f87",
          "content_hash": "sha256:49d59c67c1001be2f9312d3f21b78062b2662f7998e601340b12622ce5405f4c"
        },
        {
          "event_id": "evt_evidencecommitted_evd_phase2_topline_mqzxqcbl_71f8dc0d",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.354Z",
          "payload": {
            "evidence": {
              "id": "evd_phase2_topline",
              "object": "evidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "source": "LTN-4481 Phase II top-line results (Study 4481-201, N=347)",
              "finding": "Modified Mayo Score remission at week 16: 38.2 percent (200mg) vs 12.1 percent (placebo), p<0.001. Endoscopic improvement: 52.4 percent vs 21.8 percent.",
              "confidence": 0.91,
              "committedByParticipantId": "par_cmo",
              "committedAt": "2026-06-29T09:00:02.354Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_phase2_topline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:49d59c67c1001be2f9312d3f21b78062b2662f7998e601340b12622ce5405f4c",
          "content_hash": "sha256:ebe54e470ee5077311979aeb3643760312bb5460d8991b72c52f8f62dea60f16"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_arms_converge_mqzxqcbl_649f2cc2",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.376Z",
          "payload": {
            "assumption": {
              "id": "asm_arms_converge",
              "object": "assumption",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "text": "All four arm-level decisions support advancement. No arm produced a blocking finding.",
              "status": "active",
              "evidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_subgroup_output",
                "cte_reg_output"
              ],
              "confidence": 0.85,
              "declaredByParticipantId": "par_cmo",
              "declaredAt": "2026-06-29T09:00:02.376Z",
              "contentHash": "sha256:arm_asm_arms_converge"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ebe54e470ee5077311979aeb3643760312bb5460d8991b72c52f8f62dea60f16",
          "content_hash": "sha256:9d42af6e1835c12b382d9fd3d4a3a22a37305b8d9acd186d2b11dac8571984d0"
        },
        {
          "event_id": "evt_claimcreated_clm_go_supported_mqzxqcbl_02ad99cb",
          "event_type": "ClaimCreated",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.398Z",
          "payload": {
            "claim": {
              "id": "clm_go_supported",
              "object": "claim",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "text": "Phase III advancement is supported by converging arm-level decisions on dose, safety, subgroup discipline, and regulatory path.",
              "status": "endorsed",
              "evidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_subgroup_output",
                "cte_reg_output",
                "evd_phase2_topline"
              ],
              "assumptionIds": [
                "asm_arms_converge"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_cmo",
              "createdAt": "2026-06-29T09:00:02.420Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9d42af6e1835c12b382d9fd3d4a3a22a37305b8d9acd186d2b11dac8571984d0",
          "content_hash": "sha256:4bb719eafd1ddf3e1bd6f0088746f2338402d7876a141a03981802ff6466303c"
        },
        {
          "event_id": "evt_positiontaken_par_cmo_mqzxqcbl_d4d7b507",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.442Z",
          "payload": {
            "position": {
              "id": "pos_cmo_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_cmo",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Arms converge. Conditions from each arm are incorporated as binding.",
              "takenAt": "2026-06-29T09:00:02.464Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4bb719eafd1ddf3e1bd6f0088746f2338402d7876a141a03981802ff6466303c",
          "content_hash": "sha256:2cbbc3e2787907de7463e34691338e7c7c90b5bf606061ef4ba47f4d1638c48e"
        },
        {
          "event_id": "evt_positiontaken_par_biostat_mqzxqcbl_ffc81bb2",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.486Z",
          "payload": {
            "position": {
              "id": "pos_biostat_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_biostat",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Go decision is supported. Subgroup discipline conditions are non-negotiable.",
              "takenAt": "2026-06-29T09:00:02.508Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:2cbbc3e2787907de7463e34691338e7c7c90b5bf606061ef4ba47f4d1638c48e",
          "content_hash": "sha256:40d4f7c7bd982ee80fecc290f06738e85b92e268588db602817c91d77bf087de"
        },
        {
          "event_id": "evt_positiontaken_par_clin_pharm_mqzxqcbl_90869b53",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:02.530Z",
          "payload": {
            "position": {
              "id": "pos_clin_pharm_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_clin_pharm",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Dose is confirmed. PK monitoring conditions protect against model failure.",
              "takenAt": "2026-06-29T09:00:02.552Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:40d4f7c7bd982ee80fecc290f06738e85b92e268588db602817c91d77bf087de",
          "content_hash": "sha256:70351f7a3e92b7391ab960d783b82ea9248d0f44ada7ce48e50f9e1da724d4ef"
        },
        {
          "event_id": "evt_positiontaken_par_safety_officer_mqzxqcbl_c8a0b6d7",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.574Z",
          "payload": {
            "position": {
              "id": "pos_safety_officer_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Safety is acceptable with conditions. Stopping rules are the critical path.",
              "takenAt": "2026-06-29T09:00:02.596Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:70351f7a3e92b7391ab960d783b82ea9248d0f44ada7ce48e50f9e1da724d4ef",
          "content_hash": "sha256:620d87bc5f1637c91b2dd1b0e392326cf0f42d3fbf0058646a5d56c9a812f0f0"
        },
        {
          "event_id": "evt_positiontaken_par_reg_affairs_mqzxqcbl_186231a8",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:02.618Z",
          "payload": {
            "position": {
              "id": "pos_reg_affairs_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_reg_affairs",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Regulatory path is clear with FDA alignment.",
              "takenAt": "2026-06-29T09:00:02.640Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:620d87bc5f1637c91b2dd1b0e392326cf0f42d3fbf0058646a5d56c9a812f0f0",
          "content_hash": "sha256:355e3e4d2942a59dfa45de89efeea6a5c6f2c35dbcd03549a592bc508aa7be6d"
        },
        {
          "event_id": "evt_objectionraised_propagated_stopping_mqzxqcbl_8cabb4b4",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.662Z",
          "payload": {
            "objection": {
              "id": "obj_stopping_rules_propagated",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "Arm-level safety conditions will be enforced in the parent decision.",
              "text": "Propagated from safety arm (thd_arm_safety_assessment_ltn4481): hepatic stopping rules must be finalized before first patient dosed. This is a hard gate, not a timeline target. If organizational pressure accelerates enrollment before stopping rules are complete, this decision record documents the safety officer identified it as a non-negotiable precondition.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.684Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:355e3e4d2942a59dfa45de89efeea6a5c6f2c35dbcd03549a592bc508aa7be6d",
          "content_hash": "sha256:c55567c58803be0dc31983db797bb4c20170796cba335277447da8d888a18d6e"
        },
        {
          "event_id": "evt_objectionraised_propagated_subgroup_mqzxqcbl_f47f1a17",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.706Z",
          "payload": {
            "objection": {
              "id": "obj_subgroup_discipline_propagated",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "participantId": "par_biostat",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "The exploratory-only designation for the bio-failure subgroup will hold against organizational pressure.",
              "text": "Propagated from subgroup arm (thd_arm_subgroup_review_ltn4481): any future protocol amendment promoting the bio-failure subgroup from exploratory to confirmatory was flagged as a statistical integrity risk. This objection is recorded at the go/no-go level to ensure the escalation path is documented.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.728Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c55567c58803be0dc31983db797bb4c20170796cba335277447da8d888a18d6e",
          "content_hash": "sha256:95324898a88d1293089b8969e77af6a3b14e2d7bc41a110c6e1f11450666af57"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_go_nogo_ltn4481_mqzxqcbl_4b5c2fb7",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.750Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_go_nogo_ltn4481",
              "object": "decisionRequest",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "proposal": "Advance LTN-4481 to Phase III with all arm-level conditions incorporated as binding.",
              "status": "review",
              "supportingEvidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_safety_objection",
                "cte_subgroup_output",
                "cte_subgroup_minority",
                "cte_reg_output",
                "evd_phase2_topline"
              ],
              "supportingClaimIds": [
                "clm_go_supported"
              ],
              "supportingAssumptionIds": [
                "asm_arms_converge"
              ],
              "objectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated"
              ],
              "openedByParticipantId": "par_cmo",
              "openedAt": "2026-06-29T09:00:02.772Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:95324898a88d1293089b8969e77af6a3b14e2d7bc41a110c6e1f11450666af57",
          "content_hash": "sha256:eb3f9b7acccb654975135a6b2a1c82e4bbb37044b15278e5e84f6f161b2d06d7"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_biostat_parent_mqzxqcbl_e3f46d23",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.794Z",
          "payload": {
            "review": {
              "id": "rev_biostat_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_biostat",
              "status": "approve_with_conditions",
              "conditions": [
                "Subgroup exploratory-only designation is binding",
                "Enrollment capped at 60 percent before interim futility"
              ],
              "comment": "Go decision supported. Subgroup conditions from arm thread must be enforced.",
              "reviewedAt": "2026-06-29T09:00:02.816Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:eb3f9b7acccb654975135a6b2a1c82e4bbb37044b15278e5e84f6f161b2d06d7",
          "content_hash": "sha256:8b0c31484f83846cbd3c7f320129f418a41a5578602cd4424e014d994e36d335"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_safety_parent_mqzxqcbl_cfedd14f",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.838Z",
          "payload": {
            "review": {
              "id": "rev_safety_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_safety_officer",
              "status": "approve_with_conditions",
              "conditions": [
                "Hepatic stopping rules before FPD — hard gate",
                "DSMB charter includes hepatotoxicity review authority"
              ],
              "comment": "Safety conditions from arm thread propagate as binding conditions.",
              "reviewedAt": "2026-06-29T09:00:02.860Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8b0c31484f83846cbd3c7f320129f418a41a5578602cd4424e014d994e36d335",
          "content_hash": "sha256:5b6c48fea20525a823b49ca9e1a8aa40e305cb9acab28d9b402a543cf234c861"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_reg_parent_mqzxqcbl_2afeaf0b",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:02.882Z",
          "payload": {
            "review": {
              "id": "rev_reg_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_reg_affairs",
              "status": "approve_with_conditions",
              "conditions": [
                "IND amendment incorporates all arm-level conditions",
                "FDA Type B agreements referenced in protocol"
              ],
              "comment": "Regulatory path clear. All conditions must appear in IND amendment.",
              "reviewedAt": "2026-06-29T09:00:02.904Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:5b6c48fea20525a823b49ca9e1a8aa40e305cb9acab28d9b402a543cf234c861",
          "content_hash": "sha256:23a58416fb66f65d77f78926dc27eba052ace005e75825892d13879c77187c78"
        },
        {
          "event_id": "evt_decisionmerged_dcr_go_nogo_ltn4481_mqzxqcbl_0f94f759",
          "event_type": "DecisionMerged",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.926Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_go_nogo_ltn4481",
              "object": "decisionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "status": "approved",
              "summary": "LTN-4481 advances to Phase III. Single pivotal trial, 200mg Q4W, adaptive design. All arm-level conditions are binding. Scope narrower than requested: subgroup exploratory only, enrollment capped pre-interim, stopping rules before FPD.",
              "rationale": "Four arm-level workstreams converge: dose confirmed (PK/PD), safety acceptable with mitigation (safety assessment), subgroup disciplined to exploratory (subgroup review), regulatory path clear (regulatory strategy). Two objections propagate from arms and survive the parent decision: stopping rules hard gate and subgroup discipline. The CMO accepts residual risk on PK/PD model generalization, mitigated by in-stream sampling.",
              "conditions": [
                "Hepatic stopping rules finalized before first patient dosed — hard gate (propagated from safety arm)",
                "DSMB charter includes hepatotoxicity review authority (propagated from safety arm)",
                "Baseline ALT greater than 2x ULN exclusion (propagated from safety arm)",
                "Biweekly ALT/AST monitoring for first 12 weeks (propagated from safety arm)",
                "Bio-failure subgroup exploratory only — no alpha, no enrichment, no stratification (propagated from subgroup arm)",
                "Enrollment capped at 60 percent before interim futility readout",
                "Binding futility boundary at conditional power below 20 percent",
                "PK sampling at weeks 4 and 12 — dose adjustment if exposure deviates more than 30 percent (propagated from PK/PD arm)",
                "IND amendment references FDA Type B meeting agreements (propagated from regulatory arm)"
              ],
              "supportingEvidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_safety_objection",
                "cte_subgroup_output",
                "cte_subgroup_minority",
                "cte_reg_output",
                "evd_phase2_topline"
              ],
              "supportingClaimIds": [
                "clm_go_supported"
              ],
              "supportingAssumptionIds": [
                "asm_arms_converge"
              ],
              "objectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated"
              ],
              "reviewIds": [
                "rev_biostat_parent",
                "rev_safety_parent",
                "rev_reg_parent"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_cmo",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated"
              ],
              "minorityReportIds": [
                "mnr_parent_biostat_discipline"
              ],
              "nextAction": "Protocol team finalizes Phase III protocol incorporating all nine conditions from the four arm threads. Stopping rules and DSMB charter are critical path. Target IND amendment: 8 weeks.",
              "decidedByParticipantId": "par_cmo",
              "decidedAt": "2026-06-29T09:00:02.948Z",
              "contentHash": "sha256:arm_dcr_go_nogo_ltn4481"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:23a58416fb66f65d77f78926dc27eba052ace005e75825892d13879c77187c78",
          "content_hash": "sha256:28e7d1ac971dc850a1d0ae7bffd428d33f7eddfb7a28f668bfced0211cc08283"
        },
        {
          "event_id": "evt_minorityreportfiled_parent_dissent_mqzxqcbl_bb899a33",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.970Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_parent_biostat_discipline",
              "object": "minorityReport",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481",
              "decisionRecordId": "dcr_go_nogo_ltn4481",
              "participantId": "par_biostat",
              "text": "This minority report propagates and reinforces the arm-level dissent from thd_arm_subgroup_review_ltn4481. At the go/no-go level, the risk is compounded: now that the program has a green light to Phase III, the commercial and timeline pressures to incorporate the bio-failure subgroup finding into the design will intensify. This report documents that the lead biostatistician objects to any protocol amendment that promotes the subgroup from exploratory to confirmatory, and that the stopping-rules hard gate from the safety arm must not be softened under enrollment pressure. Both objections survive the approval and are traceable through cross-thread provenance to the arm-level decisions that originated them.",
              "objectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated"
              ],
              "filedAt": "2026-06-29T09:00:02.992Z",
              "contentHash": "sha256:mnr_parent_biostat_discipline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:28e7d1ac971dc850a1d0ae7bffd428d33f7eddfb7a28f668bfced0211cc08283",
          "content_hash": "sha256:c4d98523d4af3e9f2e5f1402aa92053c0ac5e3fd81aebdb36712846a450918c1"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_pkpd_modeling_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_clin_pharm_mqzxqcbg_530beba1",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.000Z",
          "payload": {
            "participant": {
              "id": "par_clin_pharm",
              "object": "participant",
              "kind": "human",
              "name": "Dr. A. Osei",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:afcf68de7106859365739dc03cc1f43e20a5c00cbcdf0239504b3d15dff5b3b2"
        },
        {
          "event_id": "evt_participantadded_par_pk_modeler_mqzxqcbg_22c1d2dc",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.022Z",
          "payload": {
            "participant": {
              "id": "par_pk_modeler",
              "object": "participant",
              "kind": "human",
              "name": "Dr. F. Chen",
              "role": "pk modeling scientist"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:afcf68de7106859365739dc03cc1f43e20a5c00cbcdf0239504b3d15dff5b3b2",
          "content_hash": "sha256:f29f0ba81f8e6ecf1ff9d63352ca4427f4e9a89949537ba4511f62686d32b978"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_pkpd_modeling_ltn4481_mqzxqcbh_67558c04",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.044Z",
          "payload": {
            "thread": {
              "id": "thd_arm_pkpd_modeling_ltn4481",
              "object": "thread",
              "title": "PK/PD Modeling — LTN-4481 Dose Confirmation",
              "question": "Is the 200mg Q4W dose supported by exposure-response data for Phase III?",
              "status": "active",
              "participantIds": [
                "par_clin_pharm",
                "par_pk_modeler"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:f29f0ba81f8e6ecf1ff9d63352ca4427f4e9a89949537ba4511f62686d32b978",
          "content_hash": "sha256:cb0b19621181f99bd6faa3a0785f0101608c781e051ba05b604011fd60341e42"
        },
        {
          "event_id": "evt_evidencecommitted_evd_pkpd_pop_model_mqzxqcbh_c430a76b",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.066Z",
          "payload": {
            "evidence": {
              "id": "evd_pkpd_pop_model",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "source": "Population PK/PD analysis (4481-PK-002)",
              "finding": "Exposure-response modeling on Phase II data (N=347). Cmin at steady state correlates with endoscopic improvement (R-squared 0.71). 200mg Q4W predicts 85 percent of patients achieve target exposure.",
              "confidence": 0.84,
              "committedByParticipantId": "par_pk_modeler",
              "committedAt": "2026-06-29T09:00:00.066Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_pkpd_pop_model"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:cb0b19621181f99bd6faa3a0785f0101608c781e051ba05b604011fd60341e42",
          "content_hash": "sha256:77b1f46b672dd76f046974938654d2254a87cbd474012cfc24d0c4244d426d85"
        },
        {
          "event_id": "evt_evidencecommitted_evd_pkpd_internal_validation_mqzxqcbh_af01e16b",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.088Z",
          "payload": {
            "evidence": {
              "id": "evd_pkpd_internal_validation",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "source": "Internal model validation (bootstrap, VPC)",
              "finding": "1000-replicate bootstrap shows parameter stability. Visual predictive check covers 90 percent of observed data within prediction interval. No external dataset available for external validation.",
              "confidence": 0.79,
              "committedByParticipantId": "par_pk_modeler",
              "committedAt": "2026-06-29T09:00:00.088Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_pkpd_internal_validation"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:77b1f46b672dd76f046974938654d2254a87cbd474012cfc24d0c4244d426d85",
          "content_hash": "sha256:464deeb242f1d16a9816f9279b39cd1f9e17238f8f34ae5d5d43f04aa58f88c6"
        },
        {
          "event_id": "evt_evidencecommitted_evd_dose_response_phase2_mqzxqcbh_04d8e15a",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.110Z",
          "payload": {
            "evidence": {
              "id": "evd_dose_response_phase2",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "source": "Phase II dose-response (100mg vs 200mg vs placebo)",
              "finding": "Clear dose-response: placebo 12.1 percent, 100mg 24.7 percent, 200mg 38.2 percent remission. Exposure-response is monotonic within the observed range.",
              "confidence": 0.91,
              "committedByParticipantId": "par_clin_pharm",
              "committedAt": "2026-06-29T09:00:00.110Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_dose_response_phase2"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:464deeb242f1d16a9816f9279b39cd1f9e17238f8f34ae5d5d43f04aa58f88c6",
          "content_hash": "sha256:e9c82e775991531c13d43238d796378cb0dd997864cc1d428de09bc490082f12"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_pkpd_model_generalizes_mqzxqcbh_324c1034",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.132Z",
          "payload": {
            "assumption": {
              "id": "asm_pkpd_model_generalizes",
              "object": "assumption",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "text": "The PK/PD model developed on Phase II data will generalize to the larger, more heterogeneous Phase III population without external validation.",
              "status": "active",
              "evidenceIds": [
                "evd_pkpd_internal_validation"
              ],
              "confidence": 0.69,
              "declaredByParticipantId": "par_clin_pharm",
              "declaredAt": "2026-06-29T09:00:00.132Z",
              "contentHash": "sha256:arm_asm_pkpd_model_generalizes"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e9c82e775991531c13d43238d796378cb0dd997864cc1d428de09bc490082f12",
          "content_hash": "sha256:cd350f8c3dabcf1b49d5c8442beb3255f787d9bd30aef2f2e94da5c2a5b4d120"
        },
        {
          "event_id": "evt_claimcreated_clm_dose_confirmed_mqzxqcbh_7ff00f95",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.154Z",
          "payload": {
            "claim": {
              "id": "clm_dose_confirmed",
              "object": "claim",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "text": "200mg Q4W is the confirmed Phase III dose based on exposure-response data and FDA alignment.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_pkpd_pop_model",
                "evd_dose_response_phase2"
              ],
              "assumptionIds": [
                "asm_pkpd_model_generalizes"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_clin_pharm",
              "createdAt": "2026-06-29T09:00:00.176Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:cd350f8c3dabcf1b49d5c8442beb3255f787d9bd30aef2f2e94da5c2a5b4d120",
          "content_hash": "sha256:ab39a2a34dc7719d6c1c9adde2d2e642e32ee0dd3bb915052a8e67740c5259e5"
        },
        {
          "event_id": "evt_positiontaken_par_pk_modeler_mqzxqcbh_0b282c5b",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.198Z",
          "payload": {
            "position": {
              "id": "pos_pk_modeler_support",
              "object": "position",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "participantId": "par_pk_modeler",
              "targetObjectId": "clm_dose_confirmed",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Model supports 200mg. External validation gap is a monitoring item, not a blocker.",
              "takenAt": "2026-06-29T09:00:00.220Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ab39a2a34dc7719d6c1c9adde2d2e642e32ee0dd3bb915052a8e67740c5259e5",
          "content_hash": "sha256:111d0877497a9d3be294ca20904bd7d9324801f1325e56cb0cdf74b793110faf"
        },
        {
          "event_id": "evt_positiontaken_par_clin_pharm_mqzxqcbh_c9f4fff2",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.242Z",
          "payload": {
            "position": {
              "id": "pos_clin_pharm_support",
              "object": "position",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "participantId": "par_clin_pharm",
              "targetObjectId": "clm_dose_confirmed",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Dose-response is clear. Recommend protocol-specified PK sampling at weeks 4 and 12 for early model check.",
              "takenAt": "2026-06-29T09:00:00.264Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:111d0877497a9d3be294ca20904bd7d9324801f1325e56cb0cdf74b793110faf",
          "content_hash": "sha256:9f7f76803bd2c9f79a2800458f0c435e9b2959197505a249e503cf3fd7988389"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_pkpd_dose_confirm_mqzxqcbh_7a952de6",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.286Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_pkpd_dose_confirm",
              "object": "decisionRequest",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "proposal": "Confirm 200mg Q4W for Phase III with protocol-specified early PK sampling for model validation.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_pkpd_pop_model",
                "evd_pkpd_internal_validation",
                "evd_dose_response_phase2"
              ],
              "supportingClaimIds": [
                "clm_dose_confirmed"
              ],
              "supportingAssumptionIds": [
                "asm_pkpd_model_generalizes"
              ],
              "objectionIds": [],
              "openedByParticipantId": "par_clin_pharm",
              "openedAt": "2026-06-29T09:00:00.308Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9f7f76803bd2c9f79a2800458f0c435e9b2959197505a249e503cf3fd7988389",
          "content_hash": "sha256:4b214d08760749a214ed013f466c9abf6b41cfa577be70019878712f09e850a5"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_pk_modeler_mqzxqcbh_6b5cb1e8",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.330Z",
          "payload": {
            "review": {
              "id": "rev_pk_modeler",
              "object": "review",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "decisionRequestId": "drq_pkpd_dose_confirm",
              "reviewerParticipantId": "par_pk_modeler",
              "status": "approve_with_conditions",
              "conditions": [
                "Protocol-specified PK sampling at weeks 4 and 12",
                "Dose adjustment pathway pre-specified if observed exposure deviates more than 30 percent from prediction"
              ],
              "comment": "Model supports the dose. Conditions protect against generalization failure.",
              "reviewedAt": "2026-06-29T09:00:00.352Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4b214d08760749a214ed013f466c9abf6b41cfa577be70019878712f09e850a5",
          "content_hash": "sha256:b66a5ab9bb11271fdb7c03e3b8c997aeeca296d761e1d192d1794cbac286be14"
        },
        {
          "event_id": "evt_decisionmerged_dcr_pkpd_dose_confirmed_mqzxqcbh_773150e0",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.374Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_pkpd_dose_confirmed",
              "object": "decisionRecord",
              "threadId": "thd_arm_pkpd_modeling_ltn4481",
              "decisionRequestId": "drq_pkpd_dose_confirm",
              "status": "approved",
              "summary": "200mg Q4W confirmed for Phase III. Early PK sampling and dose adjustment pathway required.",
              "rationale": "Exposure-response is monotonic and model-supported. External validation gap mitigated by in-stream PK checks.",
              "conditions": [
                "Protocol-specified PK sampling at weeks 4 and 12",
                "Dose adjustment pathway activates if observed exposure deviates more than 30 percent from model prediction"
              ],
              "supportingEvidenceIds": [
                "evd_pkpd_pop_model",
                "evd_pkpd_internal_validation",
                "evd_dose_response_phase2"
              ],
              "supportingClaimIds": [
                "clm_dose_confirmed"
              ],
              "supportingAssumptionIds": [
                "asm_pkpd_model_generalizes"
              ],
              "objectionIds": [],
              "reviewIds": [
                "rev_pk_modeler"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_clin_pharm",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [],
              "minorityReportIds": [],
              "nextAction": "Include PK sampling schedule and dose adjustment trigger in Phase III protocol.",
              "decidedByParticipantId": "par_clin_pharm",
              "decidedAt": "2026-06-29T09:00:00.396Z",
              "contentHash": "sha256:arm_dcr_pkpd_dose_confirmed"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:b66a5ab9bb11271fdb7c03e3b8c997aeeca296d761e1d192d1794cbac286be14",
          "content_hash": "sha256:a2201a26d69fac1b0206e3a53cf6c4b4eea323e3a377b61865f2f0852124093c"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_safety_assessment_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_safety_officer_mqzxqcbi_632b008a",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.418Z",
          "payload": {
            "participant": {
              "id": "par_safety_officer",
              "object": "participant",
              "kind": "human",
              "name": "Dr. T. Nakamura",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:378b60acfeb62d23b4bce5e308acbd64c26a090252acc2c9c8a7512d3db533f7"
        },
        {
          "event_id": "evt_participantadded_par_dili_panel_mqzxqcbi_dd8a129e",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.440Z",
          "payload": {
            "participant": {
              "id": "par_dili_panel",
              "object": "participant",
              "kind": "human",
              "name": "DILI Expert Panel",
              "role": "independent reviewer"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:378b60acfeb62d23b4bce5e308acbd64c26a090252acc2c9c8a7512d3db533f7",
          "content_hash": "sha256:6250e743112742466e7a26fffe9a6552296f3956979f76086ecdc94275fc969a"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_safety_assessment_ltn4481_mqzxqcbi_8fbba2e3",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.462Z",
          "payload": {
            "thread": {
              "id": "thd_arm_safety_assessment_ltn4481",
              "object": "thread",
              "title": "Safety Signal Assessment — LTN-4481 Hepatotoxicity",
              "question": "Is the hepatotoxicity signal manageable for Phase III advancement?",
              "status": "active",
              "participantIds": [
                "par_safety_officer",
                "par_dili_panel"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:6250e743112742466e7a26fffe9a6552296f3956979f76086ecdc94275fc969a",
          "content_hash": "sha256:5d5e1272da9560ce0f8ae0db740432f62839a1da08738684b195fd3f299323b9"
        },
        {
          "event_id": "evt_evidencecommitted_evd_integrated_safety_mqzxqcbi_fc6d64f0",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.484Z",
          "payload": {
            "evidence": {
              "id": "evd_integrated_safety",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "source": "Integrated safety database (4481-ISS-001, N=612)",
              "finding": "SAE rate 6.8 percent vs 5.2 percent placebo. Two serious hepatotoxicity cases (ALT greater than 10x ULN) in 200mg arm, both resolved on discontinuation. No deaths. Infection rate 14.3 percent vs 11.7 percent placebo.",
              "confidence": 0.88,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:00.484Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_integrated_safety"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:5d5e1272da9560ce0f8ae0db740432f62839a1da08738684b195fd3f299323b9",
          "content_hash": "sha256:2b655a231c5ea1cd82efa8a3881ac62bab52601c1c877a05745c2325f46e0118"
        },
        {
          "event_id": "evt_evidencecommitted_evd_dili_panel_review_mqzxqcbi_bcc4974d",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.506Z",
          "payload": {
            "evidence": {
              "id": "evd_dili_panel_review",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "source": "DILI expert panel assessment (4481-SA-003)",
              "finding": "Panel consensus: probable drug-related hepatotoxicity, confounded by baseline hepatic steatosis. Recommends excluding baseline ALT greater than 2x ULN and biweekly liver monitoring for first 12 weeks.",
              "confidence": 0.79,
              "committedByParticipantId": "par_dili_panel",
              "committedAt": "2026-06-29T09:00:00.506Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_dili_panel_review"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:2b655a231c5ea1cd82efa8a3881ac62bab52601c1c877a05745c2325f46e0118",
          "content_hash": "sha256:8111bb04ff9f19f69a5a355d396c913cf06ee41246a057a07f155bfeee149e6d"
        },
        {
          "event_id": "evt_evidencecommitted_evd_class_context_mqzxqcbi_b621be7e",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.528Z",
          "payload": {
            "evidence": {
              "id": "evd_class_context",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "source": "Hepatotoxicity class context (FDA safety communications 2024-2026)",
              "finding": "FDA has issued two safety-based label changes for UC drugs in the past 18 months related to hepatic signals. Heightened scrutiny expected.",
              "confidence": 0.86,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:00.528Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_class_context"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8111bb04ff9f19f69a5a355d396c913cf06ee41246a057a07f155bfeee149e6d",
          "content_hash": "sha256:eb60fd3824ee8162b187bd41f4869296f4ffa2627d810fd9d420615a5a397b8d"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_monitoring_sufficient_mqzxqcbi_c0847a75",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.550Z",
          "payload": {
            "assumption": {
              "id": "asm_monitoring_sufficient",
              "object": "assumption",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "text": "Enhanced monitoring (biweekly ALT/AST for 12 weeks) and exclusion criteria (baseline ALT greater than 2x ULN) are sufficient to manage the hepatotoxicity risk in Phase III.",
              "status": "active",
              "evidenceIds": [
                "evd_dili_panel_review",
                "evd_integrated_safety"
              ],
              "confidence": 0.76,
              "declaredByParticipantId": "par_safety_officer",
              "declaredAt": "2026-06-29T09:00:00.550Z",
              "contentHash": "sha256:arm_asm_monitoring_sufficient"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:eb60fd3824ee8162b187bd41f4869296f4ffa2627d810fd9d420615a5a397b8d",
          "content_hash": "sha256:c1934cb9a26717b127ebe5ef12d9d233f571d2d3b7e2c23238d63218e01d1c27"
        },
        {
          "event_id": "evt_claimcreated_clm_safety_manageable_mqzxqcbi_88288ad9",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.572Z",
          "payload": {
            "claim": {
              "id": "clm_safety_manageable",
              "object": "claim",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "text": "Hepatotoxicity signal is manageable for Phase III with protocol-level mitigation per DILI panel recommendations.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_integrated_safety",
                "evd_dili_panel_review"
              ],
              "assumptionIds": [
                "asm_monitoring_sufficient"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_safety_officer",
              "createdAt": "2026-06-29T09:00:00.594Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c1934cb9a26717b127ebe5ef12d9d233f571d2d3b7e2c23238d63218e01d1c27",
          "content_hash": "sha256:5a2a1c4d1e6e62635ccb86ab902f73a310cba50b3aab15d27f8042f36b57c5fb"
        },
        {
          "event_id": "evt_positiontaken_par_dili_panel_mqzxqcbi_a15019b9",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.616Z",
          "payload": {
            "position": {
              "id": "pos_dili_panel_support",
              "object": "position",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "participantId": "par_dili_panel",
              "targetObjectId": "clm_safety_manageable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Signal is concerning but pattern is consistent with known mechanism. Mitigation measures are standard for the class.",
              "takenAt": "2026-06-29T09:00:00.638Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:5a2a1c4d1e6e62635ccb86ab902f73a310cba50b3aab15d27f8042f36b57c5fb",
          "content_hash": "sha256:94384f8bef7a28e3311c9342092daf9436bd4a35e554d63f84e246d7d2e3be40"
        },
        {
          "event_id": "evt_objectionraised_stopping_rules_mqzxqcbi_777e0e65",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.660Z",
          "payload": {
            "objection": {
              "id": "obj_arm_stopping_rules",
              "object": "objection",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_safety_manageable",
              "targetObjectType": "claim",
              "assumption": "Monitoring alone is a complete safety plan.",
              "text": "Monitoring without quantitative stopping rules is not a safety plan. The DSMB must have pre-specified criteria for recommending clinical hold on hepatic events. These must be finalized before first patient dosed.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:00.682Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:94384f8bef7a28e3311c9342092daf9436bd4a35e554d63f84e246d7d2e3be40",
          "content_hash": "sha256:40fb0ce23ded2214b2bd307e7a172334c386cf39d75f615d0ef3aa8171a25238"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_safety_assessment_mqzxqcbi_b5c82fe9",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.704Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_safety_assessment",
              "object": "decisionRequest",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "proposal": "Safety profile is acceptable for Phase III with DILI panel mitigation measures and hepatic stopping rules.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_integrated_safety",
                "evd_dili_panel_review",
                "evd_class_context"
              ],
              "supportingClaimIds": [
                "clm_safety_manageable"
              ],
              "supportingAssumptionIds": [
                "asm_monitoring_sufficient"
              ],
              "objectionIds": [
                "obj_arm_stopping_rules"
              ],
              "openedByParticipantId": "par_safety_officer",
              "openedAt": "2026-06-29T09:00:00.726Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:40fb0ce23ded2214b2bd307e7a172334c386cf39d75f615d0ef3aa8171a25238",
          "content_hash": "sha256:5d94fa4996b983198bd6c9557ddc8be861898fc6c215c06088e3ea584b6f9579"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_dili_panel_mqzxqcbi_fe93361f",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.748Z",
          "payload": {
            "review": {
              "id": "rev_dili_panel",
              "object": "review",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "decisionRequestId": "drq_safety_assessment",
              "reviewerParticipantId": "par_dili_panel",
              "status": "approve_with_conditions",
              "conditions": [
                "Baseline ALT greater than 2x ULN exclusion",
                "Biweekly ALT/AST monitoring first 12 weeks",
                "Quantitative stopping rules in protocol before FPD"
              ],
              "comment": "Panel endorses advancement with mitigation.",
              "reviewedAt": "2026-06-29T09:00:00.770Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:5d94fa4996b983198bd6c9557ddc8be861898fc6c215c06088e3ea584b6f9579",
          "content_hash": "sha256:813a2a8e04d5ac01301ba235223b46a3b99f7ece5352ec1acd891f75525e9834"
        },
        {
          "event_id": "evt_decisionmerged_dcr_safety_acceptable_mqzxqcbi_85ae2e89",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.792Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_safety_acceptable",
              "object": "decisionRecord",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "decisionRequestId": "drq_safety_assessment",
              "status": "approved",
              "summary": "Safety profile acceptable for Phase III with three hard-gated conditions.",
              "rationale": "Two hepatotoxicity cases are concerning but confounded and resolved. DILI panel consensus supports advancement. Stopping rules objection is incorporated as a binding pre-FPD condition.",
              "conditions": [
                "Baseline ALT greater than 2x ULN exclusion criterion",
                "Biweekly ALT/AST monitoring for first 12 weeks",
                "Quantitative hepatic stopping rules finalized before first patient dosed — hard gate"
              ],
              "supportingEvidenceIds": [
                "evd_integrated_safety",
                "evd_dili_panel_review",
                "evd_class_context"
              ],
              "supportingClaimIds": [
                "clm_safety_manageable"
              ],
              "supportingAssumptionIds": [
                "asm_monitoring_sufficient"
              ],
              "objectionIds": [
                "obj_arm_stopping_rules"
              ],
              "reviewIds": [
                "rev_dili_panel"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_safety_officer",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [
                "obj_arm_stopping_rules"
              ],
              "minorityReportIds": [
                "mnr_arm_stopping_rules_gate"
              ],
              "nextAction": "Stopping rules and DSMB charter are critical path items.",
              "decidedByParticipantId": "par_safety_officer",
              "decidedAt": "2026-06-29T09:00:00.814Z",
              "contentHash": "sha256:arm_dcr_safety_acceptable"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:813a2a8e04d5ac01301ba235223b46a3b99f7ece5352ec1acd891f75525e9834",
          "content_hash": "sha256:2208d49917c919cdb518a754e6f53534b173a38002bb29e41cd160fff73d80c8"
        },
        {
          "event_id": "evt_minorityreportfiled_stopping_rules_mqzxqcbi_05a355e4",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_arm_safety_assessment_ltn4481",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.836Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_arm_stopping_rules_gate",
              "object": "minorityReport",
              "threadId": "thd_arm_safety_assessment_ltn4481",
              "decisionRecordId": "dcr_safety_acceptable",
              "participantId": "par_safety_officer",
              "text": "The safety officer files this report to ensure the stopping-rules condition is treated as a hard gate. Monitoring without quantitative decision criteria is surveillance without a trigger. If enrollment begins before stopping rules are finalized, this record documents that the risk was identified and the condition was explicitly designated as non-negotiable.",
              "objectionIds": [
                "obj_arm_stopping_rules"
              ],
              "filedAt": "2026-06-29T09:00:00.858Z",
              "contentHash": "sha256:arm_mnr_stopping_rules_gate"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:2208d49917c919cdb518a754e6f53534b173a38002bb29e41cd160fff73d80c8",
          "content_hash": "sha256:93f685a99ba2f8161fd56f8406e5c43aa8e76bc648dae6883f8cb5b993f4d09f"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_subgroup_review_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_biostat_mqzxqcbj_2539e413",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.880Z",
          "payload": {
            "participant": {
              "id": "par_biostat",
              "object": "participant",
              "kind": "human",
              "name": "Dr. K. Liang",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:ee0c3ddfcbab789ea2ddca33449a0c209677f1e2512ffcdb0dec5a2431cda1bd"
        },
        {
          "event_id": "evt_participantadded_par_cmo_mqzxqcbj_c9b6d71d",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:00.902Z",
          "payload": {
            "participant": {
              "id": "par_cmo",
              "object": "participant",
              "kind": "human",
              "name": "Dr. R. Vasquez",
              "role": "clinical sponsor"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ee0c3ddfcbab789ea2ddca33449a0c209677f1e2512ffcdb0dec5a2431cda1bd",
          "content_hash": "sha256:afc846dab6431de55f718b3220f349c6a7b7fabc8ad7e8ac7e20d862eb655a21"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_subgroup_review_ltn4481_mqzxqcbj_8d8527dd",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.924Z",
          "payload": {
            "thread": {
              "id": "thd_arm_subgroup_review_ltn4481",
              "object": "thread",
              "title": "Subgroup Analysis Review — LTN-4481 Bio-Failure Responders",
              "question": "Should the post-hoc bio-failure subgroup finding influence Phase III trial design?",
              "status": "active",
              "participantIds": [
                "par_biostat",
                "par_cmo"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:afc846dab6431de55f718b3220f349c6a7b7fabc8ad7e8ac7e20d862eb655a21",
          "content_hash": "sha256:29ca428196c4a4e9c789b01900d2e9df54fe86e566aa31704a55f59915758aa3"
        },
        {
          "event_id": "evt_evidencecommitted_evd_subgroup_data_mqzxqcbj_6f5c19f4",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.946Z",
          "payload": {
            "evidence": {
              "id": "evd_subgroup_data",
              "object": "evidence",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "source": "Post-hoc subgroup analysis (4481-201-SGA)",
              "finding": "Bio-failure patients (n=89) showed 46.3 percent remission vs 34.1 percent bio-naive. Post-hoc, not pre-specified. CI: 32.8-59.8 percent. Sample size inadequate for confirmatory inference.",
              "confidence": 0.62,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:00.946Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_subgroup_data"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:29ca428196c4a4e9c789b01900d2e9df54fe86e566aa31704a55f59915758aa3",
          "content_hash": "sha256:ceb649b06f4ba28b1d3c2a4ac0104a583b833692db0ca7253c2ffd11e101a96d"
        },
        {
          "event_id": "evt_evidencecommitted_evd_fda_subgroup_guidance_mqzxqcbj_a2eb99c6",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.968Z",
          "payload": {
            "evidence": {
              "id": "evd_fda_subgroup_guidance",
              "object": "evidence",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "source": "FDA guidance on subgroup analyses in clinical trials (2023)",
              "finding": "FDA expects subgroup analyses to be pre-specified in the SAP. Post-hoc findings may be hypothesis-generating but should not drive primary endpoint strategy or enrichment without independent confirmation.",
              "confidence": 0.93,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:00.968Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_fda_subgroup_guidance"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ceb649b06f4ba28b1d3c2a4ac0104a583b833692db0ca7253c2ffd11e101a96d",
          "content_hash": "sha256:16f3ea6678a4f0f97945f6fec546f362b7b198f78c1db66bafeecc0e7d72aca2"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_subgroup_exploratory_only_mqzxqcbj_75c303ed",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.990Z",
          "payload": {
            "assumption": {
              "id": "asm_subgroup_exploratory_only",
              "object": "assumption",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "text": "The bio-failure subgroup finding is hypothesis-generating only and should not drive Phase III enrichment, stratification, or primary endpoint strategy.",
              "status": "active",
              "evidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "confidence": 0.72,
              "declaredByParticipantId": "par_biostat",
              "declaredAt": "2026-06-29T09:00:00.990Z",
              "contentHash": "sha256:arm_asm_subgroup_exploratory_only"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:16f3ea6678a4f0f97945f6fec546f362b7b198f78c1db66bafeecc0e7d72aca2",
          "content_hash": "sha256:04ff2a49345645679a4b45bdd27e93dd33bce536e66b47a07782ff150c72c48b"
        },
        {
          "event_id": "evt_claimcreated_clm_no_subgroup_design_influence_mqzxqcbj_17f4694a",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.012Z",
          "payload": {
            "claim": {
              "id": "clm_no_subgroup_design_influence",
              "object": "claim",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "text": "Phase III design must not incorporate the post-hoc bio-failure finding as anything other than an exploratory objective with no alpha allocation.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "assumptionIds": [
                "asm_subgroup_exploratory_only"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_biostat",
              "createdAt": "2026-06-29T09:00:01.034Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:04ff2a49345645679a4b45bdd27e93dd33bce536e66b47a07782ff150c72c48b",
          "content_hash": "sha256:98a34164281055fca8a61f496176138b2a835153897f1df63a9f71a7c3e49ee7"
        },
        {
          "event_id": "evt_positiontaken_par_biostat_mqzxqcbj_3f8004f7",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.056Z",
          "payload": {
            "position": {
              "id": "pos_biostat_support",
              "object": "position",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "participantId": "par_biostat",
              "targetObjectId": "clm_no_subgroup_design_influence",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Statistical integrity of the Phase III pivotal trial depends on this discipline.",
              "takenAt": "2026-06-29T09:00:01.078Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:98a34164281055fca8a61f496176138b2a835153897f1df63a9f71a7c3e49ee7",
          "content_hash": "sha256:ac715d9c4f952429050bb87907ef27d7afae9f5ea3481abbdb1ca0397b269a8d"
        },
        {
          "event_id": "evt_positiontaken_par_cmo_mqzxqcbj_d81f1354",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.100Z",
          "payload": {
            "position": {
              "id": "pos_cmo_support",
              "object": "position",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "participantId": "par_cmo",
              "targetObjectId": "clm_no_subgroup_design_influence",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Agree the finding is interesting but premature for design-level decisions.",
              "takenAt": "2026-06-29T09:00:01.122Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ac715d9c4f952429050bb87907ef27d7afae9f5ea3481abbdb1ca0397b269a8d",
          "content_hash": "sha256:9e4d20bf92835ab214625b16047a15aa25f0e349293508b077cfd0ef7a5c1c2d"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_subgroup_designation_mqzxqcbj_482ea301",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.144Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_subgroup_designation",
              "object": "decisionRequest",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "proposal": "Designate bio-failure subgroup as exploratory only in Phase III.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "supportingClaimIds": [
                "clm_no_subgroup_design_influence"
              ],
              "supportingAssumptionIds": [
                "asm_subgroup_exploratory_only"
              ],
              "objectionIds": [],
              "openedByParticipantId": "par_biostat",
              "openedAt": "2026-06-29T09:00:01.166Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9e4d20bf92835ab214625b16047a15aa25f0e349293508b077cfd0ef7a5c1c2d",
          "content_hash": "sha256:9177e6f86aeda856a3922381ccc9a4c95129920c59a0750495d7efc2509f2a1c"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_cmo_subgroup_mqzxqcbj_1e1bb795",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.188Z",
          "payload": {
            "review": {
              "id": "rev_cmo_subgroup",
              "object": "review",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "decisionRequestId": "drq_subgroup_designation",
              "reviewerParticipantId": "par_cmo",
              "status": "approve",
              "conditions": [],
              "comment": "Agreed. Exploratory only.",
              "reviewedAt": "2026-06-29T09:00:01.210Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9177e6f86aeda856a3922381ccc9a4c95129920c59a0750495d7efc2509f2a1c",
          "content_hash": "sha256:779cbac9b388ca9be12d93d180544893c81660ed66f548e47cc0855720de2534"
        },
        {
          "event_id": "evt_decisionmerged_dcr_subgroup_exploratory_mqzxqcbj_5ba6fb67",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.232Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_subgroup_exploratory",
              "object": "decisionRecord",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "decisionRequestId": "drq_subgroup_designation",
              "status": "approved",
              "summary": "Bio-failure subgroup designated exploratory only. No alpha allocation, no enrichment, no stratification in Phase III primary analysis.",
              "rationale": "Post-hoc finding with wide CI on 89 patients does not meet the evidentiary bar for design-level influence. FDA guidance reinforces this.",
              "conditions": [
                "No alpha allocation to bio-failure subgroup analysis",
                "No enrichment or stratification based on prior biologic exposure",
                "Subgroup analysis isolated as exploratory objective in SAP"
              ],
              "supportingEvidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "supportingClaimIds": [
                "clm_no_subgroup_design_influence"
              ],
              "supportingAssumptionIds": [
                "asm_subgroup_exploratory_only"
              ],
              "objectionIds": [],
              "reviewIds": [
                "rev_cmo_subgroup"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_biostat",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [],
              "minorityReportIds": [],
              "nextAction": "Encode exploratory designation in SAP. Monitor for internal pressure to promote.",
              "decidedByParticipantId": "par_biostat",
              "decidedAt": "2026-06-29T09:00:01.254Z",
              "contentHash": "sha256:arm_dcr_subgroup_exploratory"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:779cbac9b388ca9be12d93d180544893c81660ed66f548e47cc0855720de2534",
          "content_hash": "sha256:1260ada0d7cbccf8b9507e88dca27958dd7741de2f5c335fe7500d1f115011b7"
        },
        {
          "event_id": "evt_minorityreportfiled_subgroup_discipline_mqzxqcbj_adf39ed2",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_arm_subgroup_review_ltn4481",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.276Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_arm_subgroup_discipline",
              "object": "minorityReport",
              "threadId": "thd_arm_subgroup_review_ltn4481",
              "decisionRecordId": "dcr_subgroup_exploratory",
              "participantId": "par_biostat",
              "text": "This minority report is filed proactively for the trial master file. The bio-failure subgroup finding (46.3 percent remission, n=89, CI 32.8-59.8) will generate organizational pressure to promote it from exploratory to confirmatory — as enrichment, stratification, or a co-primary endpoint. Any such promotion would compromise the statistical integrity of the Phase III trial and create regulatory risk. This dissent is recorded at the arm-level decision so that if a future protocol amendment attempts to change the subgroup designation, there is a traceable record that the lead biostatistician objected at the earliest decision point.",
              "objectionIds": [],
              "filedAt": "2026-06-29T09:00:01.298Z",
              "contentHash": "sha256:arm_mnr_subgroup_discipline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:1260ada0d7cbccf8b9507e88dca27958dd7741de2f5c335fe7500d1f115011b7",
          "content_hash": "sha256:cf579f86ef8d2323ab5b97eef9e01aa2098043ed6eb97655f136893a902c11b2"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_regulatory_strategy_ltn4481",
      "events": [
        {
          "event_id": "evt_participantadded_par_reg_affairs_mqzxqcbk_5201298d",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.320Z",
          "payload": {
            "participant": {
              "id": "par_reg_affairs",
              "object": "participant",
              "kind": "human",
              "name": "J. Markova",
              "role": "decision owner"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "content_hash": "sha256:18919bcb87114fd8890438bcce6f9a64619cbae82f1c013ca2a220e64001640f"
        },
        {
          "event_id": "evt_participantadded_par_reg_writer_mqzxqcbk_8544a70d",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.342Z",
          "payload": {
            "participant": {
              "id": "par_reg_writer",
              "object": "participant",
              "kind": "human",
              "name": "M. Torres",
              "role": "regulatory writer"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:18919bcb87114fd8890438bcce6f9a64619cbae82f1c013ca2a220e64001640f",
          "content_hash": "sha256:4f58dc7b7d13e8ea290f78eefe5c8f23ccb6d9c2822b2cda42ac19fc777bed43"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_regulatory_strategy_ltn4481_mqzxqcbk_065029f6",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.364Z",
          "payload": {
            "thread": {
              "id": "thd_arm_regulatory_strategy_ltn4481",
              "object": "thread",
              "title": "Regulatory Strategy — LTN-4481 Phase III Path",
              "question": "What is the viable regulatory path for LTN-4481 Phase III?",
              "status": "active",
              "participantIds": [
                "par_reg_affairs",
                "par_reg_writer"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4f58dc7b7d13e8ea290f78eefe5c8f23ccb6d9c2822b2cda42ac19fc777bed43",
          "content_hash": "sha256:80e8feae15e184f4514972bacac86cb77d2d61d8238ceb7478e7ed9ef59b62bb"
        },
        {
          "event_id": "evt_evidencecommitted_evd_type_b_minutes_mqzxqcbk_1a20d1e5",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.386Z",
          "payload": {
            "evidence": {
              "id": "evd_type_b_minutes",
              "object": "evidence",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "source": "FDA Type B End-of-Phase-2 meeting minutes (2026-02-14)",
              "finding": "FDA agreed 200mg Q4W reasonable. Single pivotal trial acceptable with at least 500 patients and pre-specified interim futility. Hepatic monitoring plan and stopping rules required.",
              "confidence": 0.95,
              "committedByParticipantId": "par_reg_affairs",
              "committedAt": "2026-06-29T09:00:01.386Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_type_b_minutes"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:80e8feae15e184f4514972bacac86cb77d2d61d8238ceb7478e7ed9ef59b62bb",
          "content_hash": "sha256:b249c984270ebbc2db982853d2acd980ac5c2458b25eb8a3164708e6028e7f71"
        },
        {
          "event_id": "evt_evidencecommitted_evd_competitive_landscape_mqzxqcbk_0885488c",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.408Z",
          "payload": {
            "evidence": {
              "id": "evd_competitive_landscape",
              "object": "evidence",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "source": "Competitive landscape memo (2026-05-22)",
              "finding": "Three JAK inhibitors and two IL-23 inhibitors approved for UC. FDA heightened scrutiny on hepatotoxicity. Bio-failure enrichment viewed favorably if supported by pre-specified analysis.",
              "confidence": 0.86,
              "committedByParticipantId": "par_reg_writer",
              "committedAt": "2026-06-29T09:00:01.408Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_competitive_landscape"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:b249c984270ebbc2db982853d2acd980ac5c2458b25eb8a3164708e6028e7f71",
          "content_hash": "sha256:58d2fa40d6ccb329a3236a2a78c39b2dc654c75b5595fe56cd6b9f3cef81e01d"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_fda_alignment_holds_mqzxqcbk_3b48a9d3",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.430Z",
          "payload": {
            "assumption": {
              "id": "asm_fda_alignment_holds",
              "object": "assumption",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "text": "FDA Type B meeting agreements will hold through IND amendment review. No material change in FDA regulatory posture on UC drugs is expected.",
              "status": "active",
              "evidenceIds": [
                "evd_type_b_minutes"
              ],
              "confidence": 0.88,
              "declaredByParticipantId": "par_reg_affairs",
              "declaredAt": "2026-06-29T09:00:01.430Z",
              "contentHash": "sha256:arm_asm_fda_alignment_holds"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:58d2fa40d6ccb329a3236a2a78c39b2dc654c75b5595fe56cd6b9f3cef81e01d",
          "content_hash": "sha256:97f3dca60ad4b54a04ea2f319a91cf691cf45a052cd5dd6d544841312de17803"
        },
        {
          "event_id": "evt_claimcreated_clm_single_pivotal_viable_mqzxqcbk_d99a72c9",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.452Z",
          "payload": {
            "claim": {
              "id": "clm_single_pivotal_viable",
              "object": "claim",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "text": "Single pivotal trial strategy is viable with adaptive design, interim futility, and hepatic monitoring per FDA feedback.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_type_b_minutes",
                "evd_competitive_landscape"
              ],
              "assumptionIds": [
                "asm_fda_alignment_holds"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_reg_affairs",
              "createdAt": "2026-06-29T09:00:01.474Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:97f3dca60ad4b54a04ea2f319a91cf691cf45a052cd5dd6d544841312de17803",
          "content_hash": "sha256:c2001721e6a39b0501fb70aa5cb005e7c0a0003188e008bc27a77a5cc4805806"
        },
        {
          "event_id": "evt_positiontaken_par_reg_affairs_mqzxqcbk_6ed58fe4",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.496Z",
          "payload": {
            "position": {
              "id": "pos_reg_affairs_support",
              "object": "position",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "participantId": "par_reg_affairs",
              "targetObjectId": "clm_single_pivotal_viable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "FDA alignment de-risks the regulatory path substantially.",
              "takenAt": "2026-06-29T09:00:01.518Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c2001721e6a39b0501fb70aa5cb005e7c0a0003188e008bc27a77a5cc4805806",
          "content_hash": "sha256:dce8afba846ed795aa4a5f05a0e244cdbdc8c5e468ec2daca219bfcb2b1aaa85"
        },
        {
          "event_id": "evt_positiontaken_par_reg_writer_mqzxqcbk_647048dd",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.540Z",
          "payload": {
            "position": {
              "id": "pos_reg_writer_support",
              "object": "position",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "participantId": "par_reg_writer",
              "targetObjectId": "clm_single_pivotal_viable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Meeting minutes provide clear design guidance.",
              "takenAt": "2026-06-29T09:00:01.562Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:dce8afba846ed795aa4a5f05a0e244cdbdc8c5e468ec2daca219bfcb2b1aaa85",
          "content_hash": "sha256:5d3a32de2e44eb67b217fbf5b211c40017d1b8113e1ba1b245c3108bdf273bd7"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_reg_strategy_mqzxqcbk_67a78b39",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.584Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_reg_strategy",
              "object": "decisionRequest",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "proposal": "Pursue single pivotal trial with adaptive design per FDA Type B alignment.",
              "status": "review",
              "supportingEvidenceIds": [
                "evd_type_b_minutes",
                "evd_competitive_landscape"
              ],
              "supportingClaimIds": [
                "clm_single_pivotal_viable"
              ],
              "supportingAssumptionIds": [],
              "objectionIds": [],
              "openedByParticipantId": "par_reg_affairs",
              "openedAt": "2026-06-29T09:00:01.606Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:5d3a32de2e44eb67b217fbf5b211c40017d1b8113e1ba1b245c3108bdf273bd7",
          "content_hash": "sha256:fdd55aa46b2dee0e73a47c1277de206bb666ea9791b8af1ff7eb1ece1e38399b"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_reg_writer_mqzxqcbk_c45f2616",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.628Z",
          "payload": {
            "review": {
              "id": "rev_reg_writer",
              "object": "review",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "decisionRequestId": "drq_reg_strategy",
              "reviewerParticipantId": "par_reg_writer",
              "status": "approve",
              "conditions": [],
              "comment": "Path is clear. IND amendment can reference meeting minutes directly.",
              "reviewedAt": "2026-06-29T09:00:01.650Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:fdd55aa46b2dee0e73a47c1277de206bb666ea9791b8af1ff7eb1ece1e38399b",
          "content_hash": "sha256:23eeadb0cc36b9f11725280a77bf72fbd7deda684e603f03f43b5325aadccc05"
        },
        {
          "event_id": "evt_decisionmerged_dcr_reg_strategy_confirmed_mqzxqcbk_076a2419",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.672Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_reg_strategy_confirmed",
              "object": "decisionRecord",
              "threadId": "thd_arm_regulatory_strategy_ltn4481",
              "decisionRequestId": "drq_reg_strategy",
              "status": "approved",
              "summary": "Single pivotal trial strategy confirmed. Adaptive design with interim futility, at least 500 patients, hepatic monitoring plan.",
              "rationale": "FDA alignment on dose, design, and monitoring requirements provides a clear regulatory path. IND amendment should reference Type B meeting minutes.",
              "conditions": [
                "Minimum 500 patients",
                "Pre-specified interim futility analysis",
                "Hepatic monitoring plan per FDA feedback",
                "IND amendment references Type B meeting agreement"
              ],
              "supportingEvidenceIds": [
                "evd_type_b_minutes",
                "evd_competitive_landscape"
              ],
              "supportingClaimIds": [
                "clm_single_pivotal_viable"
              ],
              "supportingAssumptionIds": [
                "asm_fda_alignment_holds"
              ],
              "objectionIds": [],
              "reviewIds": [
                "rev_reg_writer"
              ],
              "authorityTrail": [
                {
                  "participantId": "par_reg_affairs",
                  "role": "decision owner",
                  "source": "ParticipantAdded.role"
                }
              ],
              "preservedObjectionIds": [],
              "minorityReportIds": [],
              "nextAction": "Draft IND amendment incorporating FDA meeting agreements.",
              "decidedByParticipantId": "par_reg_affairs",
              "decidedAt": "2026-06-29T09:00:01.694Z",
              "contentHash": "sha256:arm_dcr_reg_strategy_confirmed"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:23eeadb0cc36b9f11725280a77bf72fbd7deda684e603f03f43b5325aadccc05",
          "content_hash": "sha256:e279fa9b444d03b89d640a41cafc866ebbdde4dc242ee7022f629ef8e7f27a2c"
        }
      ]
    }
  ]
};
