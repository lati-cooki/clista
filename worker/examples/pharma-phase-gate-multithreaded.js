// Generated from ClisTa-Protocol examples/manifest.json entry "pharma-phase-gate-multithreaded".
// Do not edit by hand — run `npm run sync:examples`.
export const example = {
  "id": "pharma-phase-gate-multithreaded",
  "title": "Pharma Phase II/III Go/No-Go — Multi-Arm (Octopus)",
  "summary": "A parent go/no-go that imports four arm-level decisions as CrossThreadEvidence. Three dissents survive the parent approval: two objections propagate from the arms (safety stopping rules, subgroup discipline) with the biostatistician minority report traceable two threads deep by hash, and a third originates at the go/no-go itself — the independent DSMB chair objecting that a single ~500-patient pivotal is an inadequate labeling safety database for a known hepatic signal (a dissent on whether to advance, not just how).",
  "kind": "multi-thread",
  "domain": "pharma",
  "entryThreadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
  "threads": [
    {
      "role": "parent",
      "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
      "events": [
        {
          "event_id": "evt_participantadded_par_cmo_mqyzlq90_8f838408",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.760Z",
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
          "content_hash": "sha256:1f9a5a6ff6329f776c0f2f7d0d2ca5923e6992c2a1a8327e45c6c0a6266773d6"
        },
        {
          "event_id": "evt_participantadded_par_biostat_mqyzlq9m_94b22202",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.782Z",
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
          "previous_hash": "sha256:1f9a5a6ff6329f776c0f2f7d0d2ca5923e6992c2a1a8327e45c6c0a6266773d6",
          "content_hash": "sha256:8f6f92a821a482879ff1a2800901ccf788fb85a8f0c707bdddb8e78f7ec7ab14"
        },
        {
          "event_id": "evt_participantadded_par_clin_pharm_mqyzlqa8_c015334c",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:01.804Z",
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
          "previous_hash": "sha256:8f6f92a821a482879ff1a2800901ccf788fb85a8f0c707bdddb8e78f7ec7ab14",
          "content_hash": "sha256:bffabcc062a805ed595e2a699d286fbb404bdc5583b3f8375195f03f929e36d6"
        },
        {
          "event_id": "evt_participantadded_par_reg_affairs_mqyzlqau_4297deaf",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.826Z",
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
          "previous_hash": "sha256:bffabcc062a805ed595e2a699d286fbb404bdc5583b3f8375195f03f929e36d6",
          "content_hash": "sha256:c6eb225691780a66ea08a6ee16641dcde76dcd71edbeadb348a595aaeb1f260d"
        },
        {
          "event_id": "evt_participantadded_par_safety_officer_mqyzlqbg_2d62dfc1",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:01.848Z",
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
          "previous_hash": "sha256:c6eb225691780a66ea08a6ee16641dcde76dcd71edbeadb348a595aaeb1f260d",
          "content_hash": "sha256:2a895c662b6b6c5770438c73724484146391c3cf4a02a23920f727677df7fa92"
        },
        {
          "event_id": "evt_participantadded_par_dsmb_chair_mqyzlqc2_b07e0fcc",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:01.870Z",
          "payload": {
            "participant": {
              "id": "par_dsmb_chair",
              "object": "participant",
              "kind": "human",
              "name": "Dr. E. Rowe",
              "role": "independent dsmb chair"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:2a895c662b6b6c5770438c73724484146391c3cf4a02a23920f727677df7fa92",
          "content_hash": "sha256:ba591a7f16eebbb787fab7082e174ee85963daf5db3f69dd030df7b48d321dc1"
        },
        {
          "event_id": "evt_participantadded_par_octopus_mqyzlqco_bc4890ea",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:01.892Z",
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
          "previous_hash": "sha256:ba591a7f16eebbb787fab7082e174ee85963daf5db3f69dd030df7b48d321dc1",
          "content_hash": "sha256:23bf92a6fd5cada3d508cbc40b93734b3e1d410ea123007c869e9a42011a1045"
        },
        {
          "event_id": "evt_threadcreated_thd_phase2_to_phase3_go_nogo_ltn4481_r2_mqyzlqda_773ba7f8",
          "event_type": "ThreadCreated",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.914Z",
          "payload": {
            "thread": {
              "id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
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
                "par_dsmb_chair",
                "par_octopus"
              ],
              "createdAt": "2026-06-29T09:00:00.000Z",
              "updatedAt": "2026-06-29T09:00:00.000Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:23bf92a6fd5cada3d508cbc40b93734b3e1d410ea123007c869e9a42011a1045",
          "content_hash": "sha256:c02020e278161364c02a167e17fcecded2ceba86ada7f8e7688351c1b045062c"
        },
        {
          "event_id": "evt_delegationgranted_dlg_pkpd_mqyzlqdw_7dcd5b00",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.936Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_pkpd",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "pkpd-modeling",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "summary": "Octopus delegated to execute PK/PD modeling arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:01.958Z",
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
          "previous_hash": "sha256:c02020e278161364c02a167e17fcecded2ceba86ada7f8e7688351c1b045062c",
          "content_hash": "sha256:30b54acf04d717e31f7cce79030699479fad8b2080e03d1f16e2551c85087633"
        },
        {
          "event_id": "evt_delegationgranted_dlg_safety_mqyzlqei_0c5407c5",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.980Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_safety",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "safety-signal-assessment",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "summary": "Octopus delegated to execute safety signal assessment arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:02.002Z",
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
          "previous_hash": "sha256:30b54acf04d717e31f7cce79030699479fad8b2080e03d1f16e2551c85087633",
          "content_hash": "sha256:4df67adad50f8791c610eed53253062742dc21d2f83040ba527489855af1a1e1"
        },
        {
          "event_id": "evt_delegationgranted_dlg_subgroup_mqyzlqf4_44249e76",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.024Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_subgroup",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "subgroup-analysis-review",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "summary": "Octopus delegated to execute subgroup analysis review arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:02.046Z",
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
          "previous_hash": "sha256:4df67adad50f8791c610eed53253062742dc21d2f83040ba527489855af1a1e1",
          "content_hash": "sha256:61cac438518a9c6de9184dc0d4880174ee8589bbabf9e5b154a34c263f5ca14e"
        },
        {
          "event_id": "evt_delegationgranted_dlg_reg_mqyzlqfq_3add5745",
          "event_type": "DelegationGranted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.068Z",
          "payload": {
            "delegationGrant": {
              "id": "dlg_reg",
              "object": "delegationGrant",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "delegatorParticipantId": "par_cmo",
              "delegateId": "par_octopus",
              "delegateType": "participant",
              "action": "regulatory-strategy",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "authorityRequired": "decision_owner",
              "limits": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "summary": "Octopus delegated to execute regulatory strategy arm",
              "status": "active",
              "grantedBy": "par_cmo",
              "grantedAt": "2026-06-29T09:00:02.090Z",
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
          "previous_hash": "sha256:61cac438518a9c6de9184dc0d4880174ee8589bbabf9e5b154a34c263f5ca14e",
          "content_hash": "sha256:aea262347e8a542e68387b826750501895ddae716c5732ebd82e9d96f2b5e46b"
        },
        {
          "event_id": "evt_executionstarted_exe_pkpd_mqyzlqgc_c9e82126",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.112Z",
          "payload": {
            "executionRecord": {
              "id": "exe_pkpd",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_pkpd"
              },
              "decisionId": null,
              "actionType": "pkpd-modeling",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.134Z",
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
          "previous_hash": "sha256:aea262347e8a542e68387b826750501895ddae716c5732ebd82e9d96f2b5e46b",
          "content_hash": "sha256:3f9f2283cc04de409fb75f0adb0fb322a91ed4a9b419da6215b8e50ec31b0362"
        },
        {
          "event_id": "evt_executionstarted_exe_safety_mqyzlqgy_8fd3b362",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.156Z",
          "payload": {
            "executionRecord": {
              "id": "exe_safety",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_safety"
              },
              "decisionId": null,
              "actionType": "safety-signal-assessment",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.178Z",
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
          "previous_hash": "sha256:3f9f2283cc04de409fb75f0adb0fb322a91ed4a9b419da6215b8e50ec31b0362",
          "content_hash": "sha256:0eecd254d5cd3b5734c5920a9befdbb517a938565142cf70da61a69f34e8c8ef"
        },
        {
          "event_id": "evt_executionstarted_exe_subgroup_mqyzlqhk_fac22e55",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.200Z",
          "payload": {
            "executionRecord": {
              "id": "exe_subgroup",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_subgroup"
              },
              "decisionId": null,
              "actionType": "subgroup-analysis-review",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.222Z",
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
          "previous_hash": "sha256:0eecd254d5cd3b5734c5920a9befdbb517a938565142cf70da61a69f34e8c8ef",
          "content_hash": "sha256:928666015987dbdaa1cd648efd7df1f966febcc4ebe330ed12b4f073668b6552"
        },
        {
          "event_id": "evt_executionstarted_exe_reg_mqyzlqi6_f0da9153",
          "event_type": "ExecutionStarted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_octopus",
          "timestamp": "2026-06-29T09:00:02.244Z",
          "payload": {
            "executionRecord": {
              "id": "exe_reg",
              "object": "executionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "actorId": "par_octopus",
              "authorizationRef": {
                "type": "delegation",
                "id": "dlg_reg"
              },
              "decisionId": null,
              "actionType": "regulatory-strategy",
              "scope": "thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "constraints": [
                "scope:thread:thd_phase2_to_phase3_go_nogo_ltn4481_r2"
              ],
              "status": "active",
              "startedAt": "2026-06-29T09:00:02.266Z",
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
          "previous_hash": "sha256:928666015987dbdaa1cd648efd7df1f966febcc4ebe330ed12b4f073668b6552",
          "content_hash": "sha256:010c08e8caeb69a3d87eeb80e5ac3ef443c168fc288258642d296351dfd3fa9d"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_pkpd_output_mqyzlqis_da0b90ae",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:02.288Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_pkpd_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "sourceThreadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "sourceDecisionRecordId": "dcr_pkpd_dose_confirmed",
              "sourceEventHash": "sha256:2e9a666f6eeee065b1ee62bbbb5b25c0265b4b27746a92d2206eaf0e5f3f8d68",
              "derivation": "decision_output",
              "finding": "200mg Q4W dose confirmed by exposure-response modeling. Cmin correlates with endoscopic improvement (R-squared 0.71). Early PK sampling at weeks 4 and 12 required. Dose adjustment pathway triggers if observed exposure deviates more than 30 percent from model prediction.",
              "confidence": 0.84,
              "committedByParticipantId": "par_clin_pharm",
              "committedAt": "2026-06-29T09:00:02.288Z",
              "contentHash": "sha256:cte_cte_pkpd_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:010c08e8caeb69a3d87eeb80e5ac3ef443c168fc288258642d296351dfd3fa9d",
          "content_hash": "sha256:f95c07c3e48d1383a6e2a72923775dfc70a382f5b13ea508681eca151bd27b56"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_safety_output_mqyzlqje_1512423c",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.310Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_safety_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "sourceThreadId": "thd_arm_safety_assessment_ltn4481_r2",
              "sourceDecisionRecordId": "dcr_safety_acceptable",
              "sourceEventHash": "sha256:eb2487f635c59d268075a202ce625722d72bc448e5fe7a946d88d7cf3102034b",
              "derivation": "decision_output",
              "finding": "Safety profile acceptable for Phase III with three hard-gated conditions: baseline ALT greater than 2x ULN exclusion, biweekly ALT/AST monitoring for 12 weeks, and quantitative hepatic stopping rules finalized before first patient dosed. Stopping rules condition is a preserved objection from the safety arm.",
              "confidence": 0.79,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:02.310Z",
              "contentHash": "sha256:cte_cte_safety_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:f95c07c3e48d1383a6e2a72923775dfc70a382f5b13ea508681eca151bd27b56",
          "content_hash": "sha256:65e91fc4bbc9d6330ff072c0e9a03d010bcf20945e7f1ff1dad80b22dadd29bd"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_safety_objection_mqyzlqk0_9feb8109",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.332Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_safety_objection",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "sourceThreadId": "thd_arm_safety_assessment_ltn4481_r2",
              "sourceDecisionRecordId": "dcr_safety_acceptable",
              "sourceEventHash": "sha256:eb2487f635c59d268075a202ce625722d72bc448e5fe7a946d88d7cf3102034b",
              "derivation": "preserved_objection",
              "finding": "Hepatic stopping rules must be finalized before first patient dosed. Monitoring without quantitative stopping criteria is not a safety plan. This objection survived the arm-level decision and propagates to the parent.",
              "confidence": 0.91,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:02.332Z",
              "contentHash": "sha256:cte_cte_safety_objection"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:65e91fc4bbc9d6330ff072c0e9a03d010bcf20945e7f1ff1dad80b22dadd29bd",
          "content_hash": "sha256:eb5f07f7a8993a6aa3f3fdf44b459b7d821d9f47b2174ed6def87162c2e3e4df"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_subgroup_output_mqyzlqkm_fb22d7e4",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.354Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_subgroup_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "sourceThreadId": "thd_arm_subgroup_review_ltn4481_r2",
              "sourceDecisionRecordId": "dcr_subgroup_exploratory",
              "sourceEventHash": "sha256:fd40249839eb18c00bccbfe93a689d10ef5a2005f15a86e4895e76f5cf3c6081",
              "derivation": "decision_output",
              "finding": "Bio-failure subgroup designated exploratory only. No alpha allocation, no enrichment, no stratification in Phase III primary analysis. Lead biostatistician filed proactive minority report documenting risk of organizational pressure to promote the finding.",
              "confidence": 0.72,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:02.354Z",
              "contentHash": "sha256:cte_cte_subgroup_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:eb5f07f7a8993a6aa3f3fdf44b459b7d821d9f47b2174ed6def87162c2e3e4df",
          "content_hash": "sha256:3a049a33f8aad3d4f3fa67c9c9651fae7c034f03fd2b1ad417f38ea5c9b4daea"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_subgroup_minority_mqyzlql8_d619f7d1",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.376Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_subgroup_minority",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "sourceThreadId": "thd_arm_subgroup_review_ltn4481_r2",
              "sourceDecisionRecordId": "dcr_subgroup_exploratory",
              "sourceEventHash": "sha256:fd40249839eb18c00bccbfe93a689d10ef5a2005f15a86e4895e76f5cf3c6081",
              "derivation": "minority_report",
              "finding": "Biostatistician minority report: any future protocol amendment promoting the bio-failure subgroup from exploratory to confirmatory was flagged as a statistical integrity risk at the earliest decision point. Traceable for TMF.",
              "confidence": 0.95,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:02.376Z",
              "contentHash": "sha256:cte_cte_subgroup_minority"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:3a049a33f8aad3d4f3fa67c9c9651fae7c034f03fd2b1ad417f38ea5c9b4daea",
          "content_hash": "sha256:2ea1aee68575beaa459ff63a3cacb99483a19088fe2c433243e6fcf4ff2264d2"
        },
        {
          "event_id": "evt_crossthreadevidence_cte_reg_output_mqyzlqlu_8b37e5af",
          "event_type": "CrossThreadEvidence",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:02.398Z",
          "payload": {
            "crossThreadEvidence": {
              "id": "cte_reg_output",
              "object": "crossThreadEvidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "sourceThreadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "sourceDecisionRecordId": "dcr_reg_strategy_confirmed",
              "sourceEventHash": "sha256:0d6645ab540d1592e4a5223f4b4d1d5b91043a0fd3f96f765bd3780adcb038c8",
              "derivation": "decision_output",
              "finding": "Single pivotal trial strategy confirmed. Adaptive design with interim futility, at least 500 patients, hepatic monitoring plan per FDA Type B meeting alignment. IND amendment to reference meeting minutes.",
              "confidence": 0.95,
              "committedByParticipantId": "par_reg_affairs",
              "committedAt": "2026-06-29T09:00:02.398Z",
              "contentHash": "sha256:cte_cte_reg_output"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:2ea1aee68575beaa459ff63a3cacb99483a19088fe2c433243e6fcf4ff2264d2",
          "content_hash": "sha256:e2397ae0bb176082c5a9aa0651a4e949fe65169044e8e81b3e132b190089eebc"
        },
        {
          "event_id": "evt_evidencecommitted_evd_phase2_topline_mqyzlqmg_e7d1f2c4",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.420Z",
          "payload": {
            "evidence": {
              "id": "evd_phase2_topline",
              "object": "evidence",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "source": "LTN-4481 Phase II top-line results (Study 4481-201, N=347)",
              "finding": "Modified Mayo Score remission at week 16: 38.2 percent (200mg) vs 12.1 percent (placebo), p<0.001. Endoscopic improvement: 52.4 percent vs 21.8 percent.",
              "confidence": 0.91,
              "committedByParticipantId": "par_cmo",
              "committedAt": "2026-06-29T09:00:02.420Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_phase2_topline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e2397ae0bb176082c5a9aa0651a4e949fe65169044e8e81b3e132b190089eebc",
          "content_hash": "sha256:05448aad068d72efeaaec7e0fe5e3d195e5ad72b47aad0bc7238c1a01f55bf1b"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_arms_converge_mqyzlqn2_52936097",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.442Z",
          "payload": {
            "assumption": {
              "id": "asm_arms_converge",
              "object": "assumption",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "text": "All four arm-level decisions support advancement, each with binding conditions. Advancement is conditional, not unconditional: the safety arm's hepatic stopping-rules gate is a hard precondition, so 'no blocking finding' overstates — no arm blocked outright, but the safety gate must clear before dosing.",
              "status": "active",
              "evidenceIds": [
                "cte_pkpd_output",
                "cte_safety_output",
                "cte_subgroup_output",
                "cte_reg_output"
              ],
              "confidence": 0.8,
              "declaredByParticipantId": "par_cmo",
              "declaredAt": "2026-06-29T09:00:02.442Z",
              "contentHash": "sha256:arm_asm_arms_converge"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:05448aad068d72efeaaec7e0fe5e3d195e5ad72b47aad0bc7238c1a01f55bf1b",
          "content_hash": "sha256:e9fbf2ac96be93c84647e8a7889e30138ab420ad7db4b6e2aa6c9a1e90f2da53"
        },
        {
          "event_id": "evt_claimcreated_clm_go_supported_mqyzlqno_d3b9ef18",
          "event_type": "ClaimCreated",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.464Z",
          "payload": {
            "claim": {
              "id": "clm_go_supported",
              "object": "claim",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
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
              "createdAt": "2026-06-29T09:00:02.486Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:e9fbf2ac96be93c84647e8a7889e30138ab420ad7db4b6e2aa6c9a1e90f2da53",
          "content_hash": "sha256:30c86e52069964885d7bc89b10e235c4f20ba23a4d694d1a72c5d9cf49abd0f1"
        },
        {
          "event_id": "evt_positiontaken_par_cmo_mqyzlqoa_74726b36",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.508Z",
          "payload": {
            "position": {
              "id": "pos_cmo_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_cmo",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Arms converge. Conditions from each arm are incorporated as binding.",
              "takenAt": "2026-06-29T09:00:02.530Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:30c86e52069964885d7bc89b10e235c4f20ba23a4d694d1a72c5d9cf49abd0f1",
          "content_hash": "sha256:3e56e812d43308bdcd65fb89cf0e002cff74d6443adf511b3cde6b10079de792"
        },
        {
          "event_id": "evt_positiontaken_par_biostat_mqyzlqow_acd6b374",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.552Z",
          "payload": {
            "position": {
              "id": "pos_biostat_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_biostat",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Go decision is supported. Subgroup discipline conditions are non-negotiable.",
              "takenAt": "2026-06-29T09:00:02.574Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:3e56e812d43308bdcd65fb89cf0e002cff74d6443adf511b3cde6b10079de792",
          "content_hash": "sha256:7c7e72d3cc7b0de4db59515499c576ca691329ca395c6ed5d0060b69fd068f4c"
        },
        {
          "event_id": "evt_positiontaken_par_clin_pharm_mqyzlqpi_beedb8bb",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:02.596Z",
          "payload": {
            "position": {
              "id": "pos_clin_pharm_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_clin_pharm",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Dose is confirmed. PK monitoring conditions protect against model failure.",
              "takenAt": "2026-06-29T09:00:02.618Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:7c7e72d3cc7b0de4db59515499c576ca691329ca395c6ed5d0060b69fd068f4c",
          "content_hash": "sha256:0a5fd9cfeaa845f60ecda199f07705912f0c5369518b0f70bd905a63cea51d98"
        },
        {
          "event_id": "evt_positiontaken_par_safety_officer_mqyzlqq4_7f65cdbd",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.640Z",
          "payload": {
            "position": {
              "id": "pos_safety_officer_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Safety is acceptable with conditions. Stopping rules are the critical path.",
              "takenAt": "2026-06-29T09:00:02.662Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0a5fd9cfeaa845f60ecda199f07705912f0c5369518b0f70bd905a63cea51d98",
          "content_hash": "sha256:9f8aee0f11892769c6b6dec7a056157c9b1bb3e0c575f82d04f91fc9f6edb6f9"
        },
        {
          "event_id": "evt_positiontaken_par_reg_affairs_mqyzlqqq_ca78627b",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:02.684Z",
          "payload": {
            "position": {
              "id": "pos_reg_affairs_support",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_reg_affairs",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Regulatory path is clear with FDA alignment.",
              "takenAt": "2026-06-29T09:00:02.706Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9f8aee0f11892769c6b6dec7a056157c9b1bb3e0c575f82d04f91fc9f6edb6f9",
          "content_hash": "sha256:0e342320f2e899d7301a3b10e761be678e8677173d478f3684e00799b6d65b10"
        },
        {
          "event_id": "evt_positiontaken_par_dsmb_chair_mqyzlqrc_7dbbfb71",
          "event_type": "PositionTaken",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:02.728Z",
          "payload": {
            "position": {
              "id": "pos_dsmb_chair_oppose",
              "object": "position",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_dsmb_chair",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "stance": "oppose",
              "reason": "Not opposed to the science, but a single ~500-patient pivotal is too small a safety database to carry a known hepatic signal to a label. Advise delay for a larger exposed population or a second confirmatory study before committing.",
              "takenAt": "2026-06-29T09:00:02.750Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:0e342320f2e899d7301a3b10e761be678e8677173d478f3684e00799b6d65b10",
          "content_hash": "sha256:17a9516d7fd6e36ac03b49769689c3a9116997f52a9cf3e82ff2ee8f6ee6eefe"
        },
        {
          "event_id": "evt_objectionraised_advancement_premature_mqyzlqry_893b171f",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:02.772Z",
          "payload": {
            "objection": {
              "id": "obj_advancement_premature",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_dsmb_chair",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "A single ~500-patient pivotal provides an adequate labeling safety database for a drug with a known hepatotoxicity signal.",
              "text": "The advancement decision itself is premature as scoped. A single ~500-patient pivotal doubles as the labeling safety database, but ICH E1 expects on the order of 1000-1500 exposed for a chronic, non-life-threatening indication — more so with an active hepatic signal. Recommend either an enlarged safety database or a second confirmatory study before committing to Phase III, rather than advancing on a single pivotal. Recorded as a dissent on the go decision, not merely on its conditions.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.794Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:17a9516d7fd6e36ac03b49769689c3a9116997f52a9cf3e82ff2ee8f6ee6eefe",
          "content_hash": "sha256:3cb5bc811effa931a3c5562effe0ef4bd3a11595aeea27d40c72cefe471012fa"
        },
        {
          "event_id": "evt_objectionraised_propagated_stopping_mqyzlqsk_4ccee63b",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.816Z",
          "payload": {
            "objection": {
              "id": "obj_stopping_rules_propagated",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "Arm-level safety conditions will be enforced in the parent decision.",
              "text": "Propagated from safety arm (thd_arm_safety_assessment_ltn4481_r2): hepatic stopping rules must be finalized before first patient dosed. This is a hard gate, not a timeline target. If organizational pressure accelerates enrollment before stopping rules are complete, this decision record documents the safety officer identified it as a non-negotiable precondition.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.838Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:3cb5bc811effa931a3c5562effe0ef4bd3a11595aeea27d40c72cefe471012fa",
          "content_hash": "sha256:57520651ce631b59292990d6434665785c3c0cbb1577b99d05afa5e73cec273d"
        },
        {
          "event_id": "evt_objectionraised_propagated_subgroup_mqyzlqt6_b1644704",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.860Z",
          "payload": {
            "objection": {
              "id": "obj_subgroup_discipline_propagated",
              "object": "objection",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "participantId": "par_biostat",
              "targetObjectId": "clm_go_supported",
              "targetObjectType": "claim",
              "assumption": "The exploratory-only designation for the bio-failure subgroup will hold against organizational pressure.",
              "text": "Propagated from subgroup arm (thd_arm_subgroup_review_ltn4481_r2): any future protocol amendment promoting the bio-failure subgroup from exploratory to confirmatory was flagged as a statistical integrity risk. This objection is recorded at the go/no-go level to ensure the escalation path is documented.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:02.882Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:57520651ce631b59292990d6434665785c3c0cbb1577b99d05afa5e73cec273d",
          "content_hash": "sha256:665ba6dc33fd362cceed2d83b5e286ab5297ee5e41858e179e16df027fa83793"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_go_nogo_ltn4481_mqyzlqts_060824e7",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:02.904Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_go_nogo_ltn4481",
              "object": "decisionRequest",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
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
                "obj_subgroup_discipline_propagated",
                "obj_advancement_premature"
              ],
              "openedByParticipantId": "par_cmo",
              "openedAt": "2026-06-29T09:00:02.926Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:665ba6dc33fd362cceed2d83b5e286ab5297ee5e41858e179e16df027fa83793",
          "content_hash": "sha256:82c40fa767a8e7dfed576a9cc2f08b75cb5431ef0a4aea2318647edcd30481c3"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_biostat_parent_mqyzlque_fe1d9581",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:02.948Z",
          "payload": {
            "review": {
              "id": "rev_biostat_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_biostat",
              "status": "approve_with_conditions",
              "conditions": [
                "Subgroup exploratory-only designation is binding",
                "Enrollment capped at 60 percent before interim futility"
              ],
              "comment": "Go decision supported. Subgroup conditions from arm thread must be enforced.",
              "reviewedAt": "2026-06-29T09:00:02.970Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:82c40fa767a8e7dfed576a9cc2f08b75cb5431ef0a4aea2318647edcd30481c3",
          "content_hash": "sha256:a2ab5192c742c219e109405410dfe986f6abbc6913ce1b2b1e0852c3fa43b96e"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_safety_parent_mqyzlqv0_bc2aef69",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:02.992Z",
          "payload": {
            "review": {
              "id": "rev_safety_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_safety_officer",
              "status": "approve_with_conditions",
              "conditions": [
                "Hepatic stopping rules before FPD — hard gate",
                "DSMB charter includes hepatotoxicity review authority"
              ],
              "comment": "Safety conditions from arm thread propagate as binding conditions.",
              "reviewedAt": "2026-06-29T09:00:03.014Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:a2ab5192c742c219e109405410dfe986f6abbc6913ce1b2b1e0852c3fa43b96e",
          "content_hash": "sha256:1a4e3054d61e9882971f70d0cf23ba07c934a5186d726232145c315208b59d24"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_reg_parent_mqyzlqvm_68643adb",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:03.036Z",
          "payload": {
            "review": {
              "id": "rev_reg_parent",
              "object": "review",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "reviewerParticipantId": "par_reg_affairs",
              "status": "approve_with_conditions",
              "conditions": [
                "IND amendment incorporates all arm-level conditions",
                "FDA Type B agreements referenced in protocol"
              ],
              "comment": "Regulatory path clear. All conditions must appear in IND amendment.",
              "reviewedAt": "2026-06-29T09:00:03.058Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:1a4e3054d61e9882971f70d0cf23ba07c934a5186d726232145c315208b59d24",
          "content_hash": "sha256:9fa344a953f5ac603fa9ea96a82abe005c956e2e00a120629a3dbf980f5af784"
        },
        {
          "event_id": "evt_decisionmerged_dcr_go_nogo_ltn4481_mqyzlqw8_bff824e6",
          "event_type": "DecisionMerged",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:03.080Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_go_nogo_ltn4481",
              "object": "decisionRecord",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "decisionRequestId": "drq_go_nogo_ltn4481",
              "status": "approved",
              "summary": "LTN-4481 advances to Phase III. Single pivotal trial, 200mg Q4W, adaptive design. All arm-level conditions are binding. Scope narrower than requested: subgroup exploratory only, enrollment capped pre-interim, stopping rules before FPD.",
              "rationale": "Four arm-level workstreams converge: dose confirmed (PK/PD), safety acceptable with mitigation (safety assessment), subgroup disciplined to exploratory (subgroup review), regulatory path clear (regulatory strategy). Two objections propagate from arms and survive the parent decision: stopping rules hard gate and subgroup discipline. A third, distinct dissent — the independent DSMB chair's objection that a single ~500-patient pivotal is an inadequate labeling safety database for a known hepatic signal — is on the go decision itself; the CMO acknowledges it, elects to advance on the FDA-aligned single-pivotal path, and preserves the dissent rather than resolving it. The CMO accepts residual risk on PK/PD model generalization, mitigated by in-stream sampling.",
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
                "obj_subgroup_discipline_propagated",
                "obj_advancement_premature"
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
                "obj_subgroup_discipline_propagated",
                "obj_advancement_premature"
              ],
              "minorityReportIds": [
                "mnr_parent_biostat_discipline",
                "mnr_parent_advancement_dissent"
              ],
              "nextAction": "Protocol team finalizes Phase III protocol incorporating all nine conditions from the four arm threads. Stopping rules and DSMB charter are critical path. Target IND amendment: 8 weeks.",
              "decidedByParticipantId": "par_cmo",
              "decidedAt": "2026-06-29T09:00:03.102Z",
              "contentHash": "sha256:arm_dcr_go_nogo_ltn4481"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9fa344a953f5ac603fa9ea96a82abe005c956e2e00a120629a3dbf980f5af784",
          "content_hash": "sha256:3f1875e42a988f4412a79de8e10dab7dab1b232c53c84b88927232dfdb9c2f82"
        },
        {
          "event_id": "evt_minorityreportfiled_parent_dissent_mqyzlqwu_1a89773c",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:03.124Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_parent_biostat_discipline",
              "object": "minorityReport",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "decisionRecordId": "dcr_go_nogo_ltn4481",
              "participantId": "par_biostat",
              "text": "This minority report propagates and reinforces the arm-level dissent from thd_arm_subgroup_review_ltn4481_r2. At the go/no-go level, the risk is compounded: now that the program has a green light to Phase III, the commercial and timeline pressures to incorporate the bio-failure subgroup finding into the design will intensify. This report documents that the lead biostatistician objects to any protocol amendment that promotes the subgroup from exploratory to confirmatory, and that the stopping-rules hard gate from the safety arm must not be softened under enrollment pressure. Both objections survive the approval and are traceable through cross-thread provenance to the arm-level decisions that originated them.",
              "objectionIds": [
                "obj_stopping_rules_propagated",
                "obj_subgroup_discipline_propagated"
              ],
              "filedAt": "2026-06-29T09:00:03.146Z",
              "contentHash": "sha256:mnr_parent_biostat_discipline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:3f1875e42a988f4412a79de8e10dab7dab1b232c53c84b88927232dfdb9c2f82",
          "content_hash": "sha256:6520ec264ade67461675528a973a9151e62742f682829515a2a0e5a911a37acf"
        },
        {
          "event_id": "evt_minorityreportfiled_advancement_dissent_mqyzlqxg_a910192c",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
          "actor_id": "par_dsmb_chair",
          "timestamp": "2026-06-29T09:00:03.168Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_parent_advancement_dissent",
              "object": "minorityReport",
              "threadId": "thd_phase2_to_phase3_go_nogo_ltn4481_r2",
              "decisionRecordId": "dcr_go_nogo_ltn4481",
              "participantId": "par_dsmb_chair",
              "text": "The independent DSMB chair dissents from the advancement decision as scoped. The program is advancing to Phase III on a single ~500-patient pivotal that will also serve as the labeling safety database for a drug with two serious transaminase elevations in Phase II. ICH E1 expects roughly 1000-1500 exposed for a chronic, non-life-threatening indication, and a live hepatic signal argues for more, not fewer. This report records that the chair recommended an enlarged safety database or a second confirmatory study before committing, that the decision proceeded on the FDA-aligned single-pivotal path notwithstanding, and that this dissent is on whether to advance — not merely on the conditions of advancement.",
              "objectionIds": [
                "obj_advancement_premature"
              ],
              "filedAt": "2026-06-29T09:00:03.190Z",
              "contentHash": "sha256:mnr_parent_advancement_dissent"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:6520ec264ade67461675528a973a9151e62742f682829515a2a0e5a911a37acf",
          "content_hash": "sha256:a9d90fbae0ba6425d0968c271b3bf826884d8a72ad4303df20e8f00a7c1d3a0a"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
      "events": [
        {
          "event_id": "evt_participantadded_par_clin_pharm_mqyzlpc0_f0d642c8",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
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
          "content_hash": "sha256:bff36612bde0a678b009daf3d0dd7b633eb985b355dbecdd6b4d957d6eedf826"
        },
        {
          "event_id": "evt_participantadded_par_pk_modeler_mqyzlpcm_9af1f5fd",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
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
          "previous_hash": "sha256:bff36612bde0a678b009daf3d0dd7b633eb985b355dbecdd6b4d957d6eedf826",
          "content_hash": "sha256:4c4c1dcbdf22a2621b3b21aeaf79c9d9af6f5b0830a880343a5c7254c930cbdc"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_pkpd_modeling_ltn4481_r2_mqyzlpd8_66c57861",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.044Z",
          "payload": {
            "thread": {
              "id": "thd_arm_pkpd_modeling_ltn4481_r2",
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
          "previous_hash": "sha256:4c4c1dcbdf22a2621b3b21aeaf79c9d9af6f5b0830a880343a5c7254c930cbdc",
          "content_hash": "sha256:079fa134842a46f287f45217837fdb443640f818d81d2d8011e6b26c010a1b46"
        },
        {
          "event_id": "evt_evidencecommitted_evd_pkpd_pop_model_mqyzlpdu_d3028a72",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.066Z",
          "payload": {
            "evidence": {
              "id": "evd_pkpd_pop_model",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
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
          "previous_hash": "sha256:079fa134842a46f287f45217837fdb443640f818d81d2d8011e6b26c010a1b46",
          "content_hash": "sha256:18f1d47a15e76f04d7d72ef82f49949659508bee44fd7fe13f927cddbb17e425"
        },
        {
          "event_id": "evt_evidencecommitted_evd_pkpd_internal_validation_mqyzlpeg_511bd8bd",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.088Z",
          "payload": {
            "evidence": {
              "id": "evd_pkpd_internal_validation",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
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
          "previous_hash": "sha256:18f1d47a15e76f04d7d72ef82f49949659508bee44fd7fe13f927cddbb17e425",
          "content_hash": "sha256:ed94dbc1381a5a9fd6fdd269d06a25923ee77a6ca014dbace0af8cc0e30a6565"
        },
        {
          "event_id": "evt_evidencecommitted_evd_dose_response_phase2_mqyzlpf2_ed045dd8",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.110Z",
          "payload": {
            "evidence": {
              "id": "evd_dose_response_phase2",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "source": "Phase II dose-response (100mg vs 200mg vs placebo)",
              "finding": "Clear dose-response: placebo 12.1 percent, 100mg 24.7 percent, 200mg 38.2 percent remission. Exposure-response is monotonic and still rising at 200mg — the top of the dose-response was not characterized above 200mg (only two active levels tested).",
              "confidence": 0.91,
              "committedByParticipantId": "par_clin_pharm",
              "committedAt": "2026-06-29T09:00:00.110Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_dose_response_phase2"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:ed94dbc1381a5a9fd6fdd269d06a25923ee77a6ca014dbace0af8cc0e30a6565",
          "content_hash": "sha256:4d9aa8a4077ac606f15acda48b7ff98eaa92c67b86ddc42b4d75d02605e93f2f"
        },
        {
          "event_id": "evt_evidencecommitted_evd_hepatic_exposure_response_mqyzlpfo_c078f851",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.132Z",
          "payload": {
            "evidence": {
              "id": "evd_hepatic_exposure_response",
              "object": "evidence",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "source": "Hepatic safety exposure-response check (4481-PK-005)",
              "finding": "Both serious transaminase elevations occurred at 200mg, but with two active dose levels and n=2 events no exposure-response for hepatotoxicity could be established. Dose selection therefore rests on the efficacy exposure-response; the hepatic signal is managed by monitoring and stopping rules, not by dose reduction.",
              "confidence": 0.61,
              "committedByParticipantId": "par_pk_modeler",
              "committedAt": "2026-06-29T09:00:00.132Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_hepatic_exposure_response"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4d9aa8a4077ac606f15acda48b7ff98eaa92c67b86ddc42b4d75d02605e93f2f",
          "content_hash": "sha256:db167900b4c8dc4a813fc40ad4836027d30e8321021b2dc86c72b1137d7f6bc4"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_pkpd_model_generalizes_mqyzlpga_3fe5d61c",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.154Z",
          "payload": {
            "assumption": {
              "id": "asm_pkpd_model_generalizes",
              "object": "assumption",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "text": "The PK/PD model developed on Phase II data will generalize to the larger, more heterogeneous Phase III population without external validation.",
              "status": "active",
              "evidenceIds": [
                "evd_pkpd_internal_validation"
              ],
              "confidence": 0.69,
              "declaredByParticipantId": "par_clin_pharm",
              "declaredAt": "2026-06-29T09:00:00.154Z",
              "contentHash": "sha256:arm_asm_pkpd_model_generalizes"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:db167900b4c8dc4a813fc40ad4836027d30e8321021b2dc86c72b1137d7f6bc4",
          "content_hash": "sha256:96cfe0829db3b1a71895a521b5b5f01d0ecafa49f0b23dc0c01e90e2c6f97c6e"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_no_hepatic_exposure_response_mqyzlpgw_a4a492ad",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.176Z",
          "payload": {
            "assumption": {
              "id": "asm_no_hepatic_exposure_response",
              "object": "assumption",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "text": "No dose-safety exposure-response was established for the hepatic signal; the 200mg selection is efficacy-driven, and dose is not being used as a lever to manage hepatotoxicity.",
              "status": "active",
              "evidenceIds": [
                "evd_hepatic_exposure_response"
              ],
              "confidence": 0.6,
              "declaredByParticipantId": "par_clin_pharm",
              "declaredAt": "2026-06-29T09:00:00.176Z",
              "contentHash": "sha256:arm_asm_no_hepatic_exposure_response"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:96cfe0829db3b1a71895a521b5b5f01d0ecafa49f0b23dc0c01e90e2c6f97c6e",
          "content_hash": "sha256:66ca5104330c5b48618f41ce562b8c8c0638292891a92901ebbb817d3e4b3575"
        },
        {
          "event_id": "evt_claimcreated_clm_dose_confirmed_mqyzlphi_7fa708cd",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.198Z",
          "payload": {
            "claim": {
              "id": "clm_dose_confirmed",
              "object": "claim",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "text": "200mg Q4W is the confirmed Phase III maintenance dose (with a defined induction regimen through week 12) based on the efficacy exposure-response and FDA alignment; safety is managed by monitoring rather than a dose-safety relationship.",
              "status": "endorsed",
              "evidenceIds": [
                "evd_pkpd_pop_model",
                "evd_dose_response_phase2"
              ],
              "assumptionIds": [
                "asm_pkpd_model_generalizes",
                "asm_no_hepatic_exposure_response"
              ],
              "contradictingEvidenceIds": [],
              "createdByParticipantId": "par_clin_pharm",
              "createdAt": "2026-06-29T09:00:00.220Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:66ca5104330c5b48618f41ce562b8c8c0638292891a92901ebbb817d3e4b3575",
          "content_hash": "sha256:df275d2fe7191c5e6157541f5e89bad8994aa9428d5ba81eb42aac32d9a7c820"
        },
        {
          "event_id": "evt_positiontaken_par_pk_modeler_mqyzlpi4_eb5c69ae",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.242Z",
          "payload": {
            "position": {
              "id": "pos_pk_modeler_support",
              "object": "position",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "participantId": "par_pk_modeler",
              "targetObjectId": "clm_dose_confirmed",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Model supports 200mg. External validation gap is a monitoring item, not a blocker.",
              "takenAt": "2026-06-29T09:00:00.264Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:df275d2fe7191c5e6157541f5e89bad8994aa9428d5ba81eb42aac32d9a7c820",
          "content_hash": "sha256:63f4150ad61ec932ce3fca32de7f63cbb0e64a881196b0e26af4783908e1d820"
        },
        {
          "event_id": "evt_positiontaken_par_clin_pharm_mqyzlpiq_1c92c956",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.286Z",
          "payload": {
            "position": {
              "id": "pos_clin_pharm_support",
              "object": "position",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "participantId": "par_clin_pharm",
              "targetObjectId": "clm_dose_confirmed",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Dose-response is clear. Recommend protocol-specified PK sampling at weeks 4 and 12 for early model check.",
              "takenAt": "2026-06-29T09:00:00.308Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:63f4150ad61ec932ce3fca32de7f63cbb0e64a881196b0e26af4783908e1d820",
          "content_hash": "sha256:98034e9e9269aca3d41ba4e38201246347196a8a88e3bccbd21bda98f0f1ca3c"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_pkpd_dose_confirm_mqyzlpjc_e5042433",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.330Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_pkpd_dose_confirm",
              "object": "decisionRequest",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
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
              "openedAt": "2026-06-29T09:00:00.352Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:98034e9e9269aca3d41ba4e38201246347196a8a88e3bccbd21bda98f0f1ca3c",
          "content_hash": "sha256:c2ecfbbd49d5a7dc10635d012f70d2270d5a645900ea40a452f9c328b1981c68"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_pk_modeler_mqyzlpjy_d8d1ae66",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_pk_modeler",
          "timestamp": "2026-06-29T09:00:00.374Z",
          "payload": {
            "review": {
              "id": "rev_pk_modeler",
              "object": "review",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
              "decisionRequestId": "drq_pkpd_dose_confirm",
              "reviewerParticipantId": "par_pk_modeler",
              "status": "approve_with_conditions",
              "conditions": [
                "Protocol-specified PK sampling at weeks 4 and 12",
                "Dose adjustment pathway pre-specified if observed exposure deviates more than 30 percent from prediction"
              ],
              "comment": "Model supports the dose. Conditions protect against generalization failure.",
              "reviewedAt": "2026-06-29T09:00:00.396Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:c2ecfbbd49d5a7dc10635d012f70d2270d5a645900ea40a452f9c328b1981c68",
          "content_hash": "sha256:b18cfd2fe3b62c2a7b6e0edca990816ae31014cff66e0d9a2caf0d8ccedd29c3"
        },
        {
          "event_id": "evt_decisionmerged_dcr_pkpd_dose_confirmed_mqyzlpkk_9f70b872",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_pkpd_modeling_ltn4481_r2",
          "actor_id": "par_clin_pharm",
          "timestamp": "2026-06-29T09:00:00.418Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_pkpd_dose_confirmed",
              "object": "decisionRecord",
              "threadId": "thd_arm_pkpd_modeling_ltn4481_r2",
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
              "decidedAt": "2026-06-29T09:00:00.440Z",
              "contentHash": "sha256:arm_dcr_pkpd_dose_confirmed"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:b18cfd2fe3b62c2a7b6e0edca990816ae31014cff66e0d9a2caf0d8ccedd29c3",
          "content_hash": "sha256:2e9a666f6eeee065b1ee62bbbb5b25c0265b4b27746a92d2206eaf0e5f3f8d68"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_safety_assessment_ltn4481_r2",
      "events": [
        {
          "event_id": "evt_participantadded_par_safety_officer_mqyzlpl6_39cf4ce0",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.462Z",
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
          "content_hash": "sha256:c4c56349c806c5c78d9e2f824f6e29eab4fa5c401721ed0e0ac4d60a17fbf95f"
        },
        {
          "event_id": "evt_participantadded_par_dili_panel_mqyzlpls_174e5468",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.484Z",
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
          "previous_hash": "sha256:c4c56349c806c5c78d9e2f824f6e29eab4fa5c401721ed0e0ac4d60a17fbf95f",
          "content_hash": "sha256:ce0194d6b866c5b8884852f7c8b25d34a30986e4ddcf7b800af042c3ae57e5b9"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_safety_assessment_ltn4481_r2_mqyzlpme_aa0a20ad",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.506Z",
          "payload": {
            "thread": {
              "id": "thd_arm_safety_assessment_ltn4481_r2",
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
          "previous_hash": "sha256:ce0194d6b866c5b8884852f7c8b25d34a30986e4ddcf7b800af042c3ae57e5b9",
          "content_hash": "sha256:58c691b53ab239e9bdb1ea578ee31f1dc20b4ac09bbd4c5ceaa18858b02204be"
        },
        {
          "event_id": "evt_evidencecommitted_evd_integrated_safety_mqyzlpn0_45aaf41c",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.528Z",
          "payload": {
            "evidence": {
              "id": "evd_integrated_safety",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "source": "Integrated safety database (4481-ISS-001, N=612)",
              "finding": "SAE rate 6.8 percent vs 5.2 percent placebo. Two serious hepatotoxicity cases (ALT greater than 10x ULN) in 200mg arm; in both, total bilirubin remained below 2x ULN, so neither met Hy's Law criteria (isolated transaminase elevation, Temple's Corollary), and both resolved on discontinuation. No deaths. Infection rate 14.3 percent vs 11.7 percent placebo.",
              "confidence": 0.88,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:00.528Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_integrated_safety"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:58c691b53ab239e9bdb1ea578ee31f1dc20b4ac09bbd4c5ceaa18858b02204be",
          "content_hash": "sha256:a6664a3636867c615eab2b6979b75dfff853c05d956fe4b1c0f351579ac0a2e4"
        },
        {
          "event_id": "evt_evidencecommitted_evd_dili_panel_review_mqyzlpnm_824ba2d5",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.550Z",
          "payload": {
            "evidence": {
              "id": "evd_dili_panel_review",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "source": "DILI expert panel assessment (4481-SA-003)",
              "finding": "Panel consensus: probable drug-related hepatotoxicity (RUCAM 'probable'). Baseline hepatic steatosis was considered and rejected as sole cause — steatosis does not produce ALT greater than 10x ULN. Recommends excluding baseline ALT greater than 2x ULN, biweekly liver monitoring for first 12 weeks, and protocol-defined Hy's Law stopping and rechallenge rules.",
              "confidence": 0.79,
              "committedByParticipantId": "par_dili_panel",
              "committedAt": "2026-06-29T09:00:00.550Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_dili_panel_review"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:a6664a3636867c615eab2b6979b75dfff853c05d956fe4b1c0f351579ac0a2e4",
          "content_hash": "sha256:79f69cc78fb9dba28250d18b3fdbe827476b1b2f84c9d3cbda46d1a6274505d8"
        },
        {
          "event_id": "evt_evidencecommitted_evd_class_context_mqyzlpo8_940d55ab",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.572Z",
          "payload": {
            "evidence": {
              "id": "evd_class_context",
              "object": "evidence",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "source": "Hepatotoxicity class context (FDA safety communications 2024-2026)",
              "finding": "FDA has issued two safety-based label changes for UC drugs in the past 18 months related to hepatic signals. Heightened scrutiny expected.",
              "confidence": 0.86,
              "committedByParticipantId": "par_safety_officer",
              "committedAt": "2026-06-29T09:00:00.572Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_class_context"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:79f69cc78fb9dba28250d18b3fdbe827476b1b2f84c9d3cbda46d1a6274505d8",
          "content_hash": "sha256:d2ff3e43b16ffca8e83b7b679668a354aa0c14067863ebd38d99719a9b1a7e8d"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_monitoring_sufficient_mqyzlpou_04485337",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.594Z",
          "payload": {
            "assumption": {
              "id": "asm_monitoring_sufficient",
              "object": "assumption",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "text": "Enhanced monitoring (biweekly ALT/AST for 12 weeks) and exclusion criteria (baseline ALT greater than 2x ULN) are sufficient to manage the hepatotoxicity risk in Phase III.",
              "status": "active",
              "evidenceIds": [
                "evd_dili_panel_review",
                "evd_integrated_safety"
              ],
              "confidence": 0.76,
              "declaredByParticipantId": "par_safety_officer",
              "declaredAt": "2026-06-29T09:00:00.594Z",
              "contentHash": "sha256:arm_asm_monitoring_sufficient"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:d2ff3e43b16ffca8e83b7b679668a354aa0c14067863ebd38d99719a9b1a7e8d",
          "content_hash": "sha256:42583a6f016e6d1586e727cf09725209b853dcba4a686744342a6a079adce8ed"
        },
        {
          "event_id": "evt_claimcreated_clm_safety_manageable_mqyzlppg_c390b3d7",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.616Z",
          "payload": {
            "claim": {
              "id": "clm_safety_manageable",
              "object": "claim",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
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
              "createdAt": "2026-06-29T09:00:00.638Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:42583a6f016e6d1586e727cf09725209b853dcba4a686744342a6a079adce8ed",
          "content_hash": "sha256:4c4dcb7e6222671fb934691c61c33aeae146fa1ae5ff340a6b2f0b8126864d2e"
        },
        {
          "event_id": "evt_positiontaken_par_dili_panel_mqyzlpq2_d2b708dd",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.660Z",
          "payload": {
            "position": {
              "id": "pos_dili_panel_support",
              "object": "position",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "participantId": "par_dili_panel",
              "targetObjectId": "clm_safety_manageable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Signal is concerning but pattern is consistent with known mechanism. Mitigation measures are standard for the class.",
              "takenAt": "2026-06-29T09:00:00.682Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:4c4dcb7e6222671fb934691c61c33aeae146fa1ae5ff340a6b2f0b8126864d2e",
          "content_hash": "sha256:7f61c21752ba2092f967b3e0aa03e29eb880a6969b327d726f9d317f7aa071f6"
        },
        {
          "event_id": "evt_objectionraised_stopping_rules_mqyzlpqo_8e092359",
          "event_type": "ObjectionRaised",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.704Z",
          "payload": {
            "objection": {
              "id": "obj_arm_stopping_rules",
              "object": "objection",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "participantId": "par_safety_officer",
              "targetObjectId": "clm_safety_manageable",
              "targetObjectType": "claim",
              "assumption": "Monitoring alone is a complete safety plan.",
              "text": "Monitoring without quantitative stopping rules is not a safety plan. The DSMB must have pre-specified criteria for recommending clinical hold on hepatic events. These must be finalized before first patient dosed.",
              "status": "open",
              "raisedAt": "2026-06-29T09:00:00.726Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:7f61c21752ba2092f967b3e0aa03e29eb880a6969b327d726f9d317f7aa071f6",
          "content_hash": "sha256:f0d584b9c0ac57864a1f015f079ea5431355907e6d170df36510b341bd1eb615"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_safety_assessment_mqyzlpra_f3f28381",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.748Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_safety_assessment",
              "object": "decisionRequest",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
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
              "openedAt": "2026-06-29T09:00:00.770Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:f0d584b9c0ac57864a1f015f079ea5431355907e6d170df36510b341bd1eb615",
          "content_hash": "sha256:928ef8763d8946a29e410eab89e3ee73a9ad12bcfc21d035e4967d0e7f991143"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_dili_panel_mqyzlprw_facf8eed",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_dili_panel",
          "timestamp": "2026-06-29T09:00:00.792Z",
          "payload": {
            "review": {
              "id": "rev_dili_panel",
              "object": "review",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "decisionRequestId": "drq_safety_assessment",
              "reviewerParticipantId": "par_dili_panel",
              "status": "approve_with_conditions",
              "conditions": [
                "Baseline ALT greater than 2x ULN exclusion",
                "Biweekly ALT/AST monitoring first 12 weeks",
                "Quantitative stopping rules in protocol before FPD"
              ],
              "comment": "Panel endorses advancement with mitigation.",
              "reviewedAt": "2026-06-29T09:00:00.814Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:928ef8763d8946a29e410eab89e3ee73a9ad12bcfc21d035e4967d0e7f991143",
          "content_hash": "sha256:aa4c0322518f2254d31c625d2ef9d3eb3c35ea756aafbc74a1892f33582b4daf"
        },
        {
          "event_id": "evt_decisionmerged_dcr_safety_acceptable_mqyzlpsi_fd0bd071",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.836Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_safety_acceptable",
              "object": "decisionRecord",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "decisionRequestId": "drq_safety_assessment",
              "status": "approved",
              "summary": "Safety profile acceptable for Phase III with three hard-gated conditions.",
              "rationale": "Two hepatotoxicity cases are concerning; neither met Hy's Law criteria and both resolved on discontinuation. DILI panel consensus supports advancement. Stopping rules objection is incorporated as a binding pre-FPD condition.",
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
              "decidedAt": "2026-06-29T09:00:00.858Z",
              "contentHash": "sha256:arm_dcr_safety_acceptable"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:aa4c0322518f2254d31c625d2ef9d3eb3c35ea756aafbc74a1892f33582b4daf",
          "content_hash": "sha256:eb2487f635c59d268075a202ce625722d72bc448e5fe7a946d88d7cf3102034b"
        },
        {
          "event_id": "evt_minorityreportfiled_stopping_rules_mqyzlpt4_19a8e09b",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_arm_safety_assessment_ltn4481_r2",
          "actor_id": "par_safety_officer",
          "timestamp": "2026-06-29T09:00:00.880Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_arm_stopping_rules_gate",
              "object": "minorityReport",
              "threadId": "thd_arm_safety_assessment_ltn4481_r2",
              "decisionRecordId": "dcr_safety_acceptable",
              "participantId": "par_safety_officer",
              "text": "The safety officer files this report to ensure the stopping-rules condition is treated as a hard gate. Monitoring without quantitative decision criteria is surveillance without a trigger. If enrollment begins before stopping rules are finalized, this record documents that the risk was identified and the condition was explicitly designated as non-negotiable.",
              "objectionIds": [
                "obj_arm_stopping_rules"
              ],
              "filedAt": "2026-06-29T09:00:00.902Z",
              "contentHash": "sha256:arm_mnr_stopping_rules_gate"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:eb2487f635c59d268075a202ce625722d72bc448e5fe7a946d88d7cf3102034b",
          "content_hash": "sha256:610a9f499ed58f9dcd2f1377bfb3eae4073f5263f064c50237e0cc9ee38a703a"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_subgroup_review_ltn4481_r2",
      "events": [
        {
          "event_id": "evt_participantadded_par_biostat_mqyzlptq_5481cb46",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.924Z",
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
          "content_hash": "sha256:a908aac5de9603e92626d8f73bda6618870a61dfdee72ea08aea1cbb7d89a773"
        },
        {
          "event_id": "evt_participantadded_par_cmo_mqyzlpuc_83d6aebd",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:00.946Z",
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
          "previous_hash": "sha256:a908aac5de9603e92626d8f73bda6618870a61dfdee72ea08aea1cbb7d89a773",
          "content_hash": "sha256:674d205c254909751245876708f799f1b373e7e578df5450d9d1d2b37699a00b"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_subgroup_review_ltn4481_r2_mqyzlpuy_c467f226",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.968Z",
          "payload": {
            "thread": {
              "id": "thd_arm_subgroup_review_ltn4481_r2",
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
          "previous_hash": "sha256:674d205c254909751245876708f799f1b373e7e578df5450d9d1d2b37699a00b",
          "content_hash": "sha256:b5c44778fbaee8885cf9f93eab075e5fb2a7731d584e8058f151e9afcac1a4a6"
        },
        {
          "event_id": "evt_evidencecommitted_evd_subgroup_data_mqyzlpvk_88a3128c",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:00.990Z",
          "payload": {
            "evidence": {
              "id": "evd_subgroup_data",
              "object": "evidence",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
              "source": "Post-hoc subgroup analysis (4481-201-SGA)",
              "finding": "Bio-failure patients (n=89) showed 46.3 percent remission (95 percent CI 35.9-56.7, Wald) vs 34.1 percent in bio-naive patients (n=258). Post-hoc, not pre-specified; the treatment-by-subgroup interaction is not statistically significant and the nominal difference is unadjusted for multiplicity. Sample size inadequate for confirmatory inference.",
              "confidence": 0.62,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:00.990Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_subgroup_data"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:b5c44778fbaee8885cf9f93eab075e5fb2a7731d584e8058f151e9afcac1a4a6",
          "content_hash": "sha256:845cac406f5525252210428d0ca64ed360d722ca8f71963be12b98667444173f"
        },
        {
          "event_id": "evt_evidencecommitted_evd_fda_subgroup_guidance_mqyzlpw6_02062690",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.012Z",
          "payload": {
            "evidence": {
              "id": "evd_fda_subgroup_guidance",
              "object": "evidence",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
              "source": "FDA guidance on subgroup analyses in clinical trials (2023)",
              "finding": "FDA expects subgroup analyses to be pre-specified in the SAP. Post-hoc findings may be hypothesis-generating but should not drive primary endpoint strategy or enrichment without independent confirmation.",
              "confidence": 0.93,
              "committedByParticipantId": "par_biostat",
              "committedAt": "2026-06-29T09:00:01.012Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_fda_subgroup_guidance"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:845cac406f5525252210428d0ca64ed360d722ca8f71963be12b98667444173f",
          "content_hash": "sha256:04beba9f47ef859fbed392bc1df343eddfa79c64f7c5baeb1239d4f288d17b01"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_subgroup_exploratory_only_mqyzlpws_a43c19d0",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.034Z",
          "payload": {
            "assumption": {
              "id": "asm_subgroup_exploratory_only",
              "object": "assumption",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
              "text": "The bio-failure subgroup finding is hypothesis-generating only and should not drive Phase III enrichment, stratification, or primary endpoint strategy.",
              "status": "active",
              "evidenceIds": [
                "evd_subgroup_data",
                "evd_fda_subgroup_guidance"
              ],
              "confidence": 0.72,
              "declaredByParticipantId": "par_biostat",
              "declaredAt": "2026-06-29T09:00:01.034Z",
              "contentHash": "sha256:arm_asm_subgroup_exploratory_only"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:04beba9f47ef859fbed392bc1df343eddfa79c64f7c5baeb1239d4f288d17b01",
          "content_hash": "sha256:dda774f6cf3a6e7539743096e23b15febda044183a2edae11840be402c2e7a34"
        },
        {
          "event_id": "evt_claimcreated_clm_no_subgroup_design_influence_mqyzlpxe_42ad3d7d",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.056Z",
          "payload": {
            "claim": {
              "id": "clm_no_subgroup_design_influence",
              "object": "claim",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
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
              "createdAt": "2026-06-29T09:00:01.078Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:dda774f6cf3a6e7539743096e23b15febda044183a2edae11840be402c2e7a34",
          "content_hash": "sha256:9bf1a82c5af73a473f45001c6cd12a2798ff53a1c667e0109152f577553bb02e"
        },
        {
          "event_id": "evt_positiontaken_par_biostat_mqyzlpy0_04c7e8db",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.100Z",
          "payload": {
            "position": {
              "id": "pos_biostat_support",
              "object": "position",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
              "participantId": "par_biostat",
              "targetObjectId": "clm_no_subgroup_design_influence",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Statistical integrity of the Phase III pivotal trial depends on this discipline.",
              "takenAt": "2026-06-29T09:00:01.122Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:9bf1a82c5af73a473f45001c6cd12a2798ff53a1c667e0109152f577553bb02e",
          "content_hash": "sha256:8d87ba74834ea47f5da1e3dccc2c15b035ebfdee38c7c58a2ff13a3f3362547f"
        },
        {
          "event_id": "evt_positiontaken_par_cmo_mqyzlpym_ba02c28a",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.144Z",
          "payload": {
            "position": {
              "id": "pos_cmo_support",
              "object": "position",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
              "participantId": "par_cmo",
              "targetObjectId": "clm_no_subgroup_design_influence",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Agree the finding is interesting but premature for design-level decisions.",
              "takenAt": "2026-06-29T09:00:01.166Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8d87ba74834ea47f5da1e3dccc2c15b035ebfdee38c7c58a2ff13a3f3362547f",
          "content_hash": "sha256:8959f354102ad2f81d09202dae1be21cd05a5c94da33827ff228dd1d8d9d5dfb"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_subgroup_designation_mqyzlpz8_42489972",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.188Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_subgroup_designation",
              "object": "decisionRequest",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
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
              "openedAt": "2026-06-29T09:00:01.210Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8959f354102ad2f81d09202dae1be21cd05a5c94da33827ff228dd1d8d9d5dfb",
          "content_hash": "sha256:47031315d015a0f05528c1cc7951090795db431bb77e04eff2eac01ab8aaf977"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_cmo_subgroup_mqyzlpzu_136e80ea",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_cmo",
          "timestamp": "2026-06-29T09:00:01.232Z",
          "payload": {
            "review": {
              "id": "rev_cmo_subgroup",
              "object": "review",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
              "decisionRequestId": "drq_subgroup_designation",
              "reviewerParticipantId": "par_cmo",
              "status": "approve",
              "conditions": [],
              "comment": "Agreed. Exploratory only.",
              "reviewedAt": "2026-06-29T09:00:01.254Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:47031315d015a0f05528c1cc7951090795db431bb77e04eff2eac01ab8aaf977",
          "content_hash": "sha256:476a6aa143626b963cc666b656c8c376dc7407d0c5d60acd3e88d1a41f98880e"
        },
        {
          "event_id": "evt_decisionmerged_dcr_subgroup_exploratory_mqyzlq0g_50d07910",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.276Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_subgroup_exploratory",
              "object": "decisionRecord",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
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
              "decidedAt": "2026-06-29T09:00:01.298Z",
              "contentHash": "sha256:arm_dcr_subgroup_exploratory"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:476a6aa143626b963cc666b656c8c376dc7407d0c5d60acd3e88d1a41f98880e",
          "content_hash": "sha256:fd40249839eb18c00bccbfe93a689d10ef5a2005f15a86e4895e76f5cf3c6081"
        },
        {
          "event_id": "evt_minorityreportfiled_subgroup_discipline_mqyzlq12_130ead46",
          "event_type": "MinorityReportFiled",
          "thread_id": "thd_arm_subgroup_review_ltn4481_r2",
          "actor_id": "par_biostat",
          "timestamp": "2026-06-29T09:00:01.320Z",
          "payload": {
            "minorityReport": {
              "id": "mnr_arm_subgroup_discipline",
              "object": "minorityReport",
              "threadId": "thd_arm_subgroup_review_ltn4481_r2",
              "decisionRecordId": "dcr_subgroup_exploratory",
              "participantId": "par_biostat",
              "text": "This minority report is filed proactively for the trial master file. The bio-failure subgroup finding (46.3 percent remission, n=89, 95 percent CI 35.9-56.7) will generate organizational pressure to promote it from exploratory to confirmatory — as enrichment, stratification, or a co-primary endpoint. Any such promotion would compromise the statistical integrity of the Phase III trial and create regulatory risk. This dissent is recorded at the arm-level decision so that if a future protocol amendment attempts to change the subgroup designation, there is a traceable record that the lead biostatistician objected at the earliest decision point.",
              "objectionIds": [],
              "filedAt": "2026-06-29T09:00:01.342Z",
              "contentHash": "sha256:arm_mnr_subgroup_discipline"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:fd40249839eb18c00bccbfe93a689d10ef5a2005f15a86e4895e76f5cf3c6081",
          "content_hash": "sha256:339ce5d14ad92ca30c9e34624b8320a6ce03c6226e64ea474e54c7cce2ddd662"
        }
      ]
    },
    {
      "role": "arm",
      "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
      "events": [
        {
          "event_id": "evt_participantadded_par_reg_affairs_mqyzlq1o_477fedd9",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.364Z",
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
          "content_hash": "sha256:bb29207a36ec5382dac613cddddf175527c44e86a12baf4e50a1f6daafd11466"
        },
        {
          "event_id": "evt_participantadded_par_reg_writer_mqyzlq2a_30922676",
          "event_type": "ParticipantAdded",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.386Z",
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
          "previous_hash": "sha256:bb29207a36ec5382dac613cddddf175527c44e86a12baf4e50a1f6daafd11466",
          "content_hash": "sha256:f02e6be57b6da6f09b2cee87affb5b645961056bbee741f3165f240965c65732"
        },
        {
          "event_id": "evt_threadcreated_thd_arm_regulatory_strategy_ltn4481_r2_mqyzlq2w_8a8122c5",
          "event_type": "ThreadCreated",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.408Z",
          "payload": {
            "thread": {
              "id": "thd_arm_regulatory_strategy_ltn4481_r2",
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
          "previous_hash": "sha256:f02e6be57b6da6f09b2cee87affb5b645961056bbee741f3165f240965c65732",
          "content_hash": "sha256:d9614fd19abf541a1848a4032ac148cc7ac1164677044c74b03cb6b37d185cb5"
        },
        {
          "event_id": "evt_evidencecommitted_evd_type_b_minutes_mqyzlq3i_59ee1bbb",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.430Z",
          "payload": {
            "evidence": {
              "id": "evd_type_b_minutes",
              "object": "evidence",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "source": "FDA Type B End-of-Phase-2 meeting minutes (2026-02-14)",
              "finding": "FDA agreed 200mg Q4W reasonable. A single pivotal trial is acceptable as a treat-through study covering both induction and maintenance, at least 500 patients, with pre-specified interim futility — provided the induction study serves as the confirmatory source. Hepatic monitoring plan and stopping rules required.",
              "confidence": 0.95,
              "committedByParticipantId": "par_reg_affairs",
              "committedAt": "2026-06-29T09:00:01.430Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_type_b_minutes"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:d9614fd19abf541a1848a4032ac148cc7ac1164677044c74b03cb6b37d185cb5",
          "content_hash": "sha256:696f82f874d4147987eae84d72860874648f0c564341f8eff9c15bf6a711ee5a"
        },
        {
          "event_id": "evt_evidencecommitted_evd_competitive_landscape_mqyzlq44_7c0c65de",
          "event_type": "EvidenceCommitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.452Z",
          "payload": {
            "evidence": {
              "id": "evd_competitive_landscape",
              "object": "evidence",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "source": "Competitive landscape memo (2026-05-22)",
              "finding": "Three JAK inhibitors and two IL-23 inhibitors approved for UC. FDA heightened scrutiny on hepatotoxicity. Bio-failure enrichment viewed favorably if supported by pre-specified analysis.",
              "confidence": 0.86,
              "committedByParticipantId": "par_reg_writer",
              "committedAt": "2026-06-29T09:00:01.452Z",
              "artifactIds": [],
              "contentHash": "sha256:arm_evd_competitive_landscape"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:696f82f874d4147987eae84d72860874648f0c564341f8eff9c15bf6a711ee5a",
          "content_hash": "sha256:3d64534274722e0dcbf85743a2d483a5f37968b85fa4b23dcfce7a92a523838e"
        },
        {
          "event_id": "evt_assumptiondeclared_asm_fda_alignment_holds_mqyzlq4q_1824cd09",
          "event_type": "AssumptionDeclared",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.474Z",
          "payload": {
            "assumption": {
              "id": "asm_fda_alignment_holds",
              "object": "assumption",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "text": "FDA Type B meeting agreements will hold through IND amendment review. No material change in FDA regulatory posture on UC drugs is expected.",
              "status": "active",
              "evidenceIds": [
                "evd_type_b_minutes"
              ],
              "confidence": 0.88,
              "declaredByParticipantId": "par_reg_affairs",
              "declaredAt": "2026-06-29T09:00:01.474Z",
              "contentHash": "sha256:arm_asm_fda_alignment_holds"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:3d64534274722e0dcbf85743a2d483a5f37968b85fa4b23dcfce7a92a523838e",
          "content_hash": "sha256:8e8b6281a284420cc9e3b71e17b5fb90c12dd1343825c2e365b6d177bb50056b"
        },
        {
          "event_id": "evt_claimcreated_clm_single_pivotal_viable_mqyzlq5c_957b78ff",
          "event_type": "ClaimCreated",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.496Z",
          "payload": {
            "claim": {
              "id": "clm_single_pivotal_viable",
              "object": "claim",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "text": "Single pivotal trial strategy is viable as a treat-through study covering induction and maintenance, with adaptive design, interim futility, and hepatic monitoring per FDA feedback; the induction phase supplies the confirmatory evidence the single-pivotal path requires.",
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
              "createdAt": "2026-06-29T09:00:01.518Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8e8b6281a284420cc9e3b71e17b5fb90c12dd1343825c2e365b6d177bb50056b",
          "content_hash": "sha256:eb6df8f1757958ed737763f28c6f873ac92b5faf064eb2d4707c0a7a66ac7dac"
        },
        {
          "event_id": "evt_positiontaken_par_reg_affairs_mqyzlq5y_118ac9de",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.540Z",
          "payload": {
            "position": {
              "id": "pos_reg_affairs_support",
              "object": "position",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "participantId": "par_reg_affairs",
              "targetObjectId": "clm_single_pivotal_viable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "FDA alignment de-risks the regulatory path substantially.",
              "takenAt": "2026-06-29T09:00:01.562Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:eb6df8f1757958ed737763f28c6f873ac92b5faf064eb2d4707c0a7a66ac7dac",
          "content_hash": "sha256:b71eba2d9bf9c781ab258ad11d93710f7f1abb61f781e3deb27aa10d349e109f"
        },
        {
          "event_id": "evt_positiontaken_par_reg_writer_mqyzlq6k_5e6547db",
          "event_type": "PositionTaken",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.584Z",
          "payload": {
            "position": {
              "id": "pos_reg_writer_support",
              "object": "position",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "participantId": "par_reg_writer",
              "targetObjectId": "clm_single_pivotal_viable",
              "targetObjectType": "claim",
              "stance": "support",
              "reason": "Meeting minutes provide clear design guidance.",
              "takenAt": "2026-06-29T09:00:01.606Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:b71eba2d9bf9c781ab258ad11d93710f7f1abb61f781e3deb27aa10d349e109f",
          "content_hash": "sha256:7cb8c8f3fc0cbd209220192e81f6b6c82a1bc51803d3a82aef56ff0ded3a32d3"
        },
        {
          "event_id": "evt_decisionrequestopened_drq_reg_strategy_mqyzlq76_81809a81",
          "event_type": "DecisionRequestOpened",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.628Z",
          "payload": {
            "decisionRequest": {
              "id": "drq_reg_strategy",
              "object": "decisionRequest",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
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
              "openedAt": "2026-06-29T09:00:01.650Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:7cb8c8f3fc0cbd209220192e81f6b6c82a1bc51803d3a82aef56ff0ded3a32d3",
          "content_hash": "sha256:87d8db7bf9c5dc575a8d4cad21b7c824ce3020f65f81c38301d2b9a4326f1746"
        },
        {
          "event_id": "evt_reviewsubmitted_rev_reg_writer_mqyzlq7s_49e731d5",
          "event_type": "ReviewSubmitted",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_writer",
          "timestamp": "2026-06-29T09:00:01.672Z",
          "payload": {
            "review": {
              "id": "rev_reg_writer",
              "object": "review",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
              "decisionRequestId": "drq_reg_strategy",
              "reviewerParticipantId": "par_reg_writer",
              "status": "approve",
              "conditions": [],
              "comment": "Path is clear. IND amendment can reference meeting minutes directly.",
              "reviewedAt": "2026-06-29T09:00:01.694Z"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:87d8db7bf9c5dc575a8d4cad21b7c824ce3020f65f81c38301d2b9a4326f1746",
          "content_hash": "sha256:8ca669336d598f0510a070323235f65c7e6e33af3adccdec29c47ad4a84ade6e"
        },
        {
          "event_id": "evt_decisionmerged_dcr_reg_strategy_confirmed_mqyzlq8e_cb76c431",
          "event_type": "DecisionMerged",
          "thread_id": "thd_arm_regulatory_strategy_ltn4481_r2",
          "actor_id": "par_reg_affairs",
          "timestamp": "2026-06-29T09:00:01.716Z",
          "payload": {
            "decisionRecord": {
              "id": "dcr_reg_strategy_confirmed",
              "object": "decisionRecord",
              "threadId": "thd_arm_regulatory_strategy_ltn4481_r2",
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
              "decidedAt": "2026-06-29T09:00:01.738Z",
              "contentHash": "sha256:arm_dcr_reg_strategy_confirmed"
            }
          },
          "protocol_version": "clista.protocol.v0",
          "hash_version": "clista.event_hash.v1",
          "previous_hash": "sha256:8ca669336d598f0510a070323235f65c7e6e33af3adccdec29c47ad4a84ade6e",
          "content_hash": "sha256:0d6645ab540d1592e4a5223f4b4d1d5b91043a0fd3f96f765bd3780adcb038c8"
        }
      ]
    }
  ]
};
