#include <eosio/eosio.hpp>
#include <eosio/system.hpp>
#include <eosio/time.hpp>
#include <eosio/asset.hpp>
#include <eosio/symbol.hpp>
#include <eosio/singleton.hpp>
#include <string>
using namespace eosio;
using namespace std;

CONTRACT llmtest : public contract {

  public:
    using contract::contract;

  TABLE tests {
    uint64_t id;
    name userid;
    name testid;
    eosio::time_point_sec created_at;
    std::vector<double> results;
    string description;

    uint64_t primary_key() const { return id; }
    uint64_t third_key() const { return created_at.sec_since_epoch(); }
    uint64_t user_key() const { return userid.value; }
    uint64_t test_key() const { return testid.value; }
  };

  typedef eosio::multi_index<
    name("testtable"), 
    tests,
    eosio::indexed_by<
      name("id"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::primary_key  
      >
    >,
    eosio::indexed_by<
      name("timestamp"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::third_key
      >  
    >,
    eosio::indexed_by<
      name("users"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::user_key
      >  
    >,
    eosio::indexed_by<
      name("testid"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::test_key
      >
    >
  > tests_table;

  TABLE timetests {
    uint64_t id;
    name userid;
    name testid;
    eosio::time_point_sec created_at;
    std::vector<double> results;
    string description;

    uint64_t primary_key() const { return id; }
    uint64_t third_key() const { return created_at.sec_since_epoch(); }
    uint64_t user_key() const { return userid.value; }
    uint64_t test_key() const { return testid.value; }
  };

  typedef eosio::multi_index<
    name("timetable"), 
    tests,
    eosio::indexed_by<
      name("id"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::primary_key  
      >
    >,
    eosio::indexed_by<
      name("timestamp"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::third_key
      >  
    >,
    eosio::indexed_by<
      name("users"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::user_key
      >  
    >,
    eosio::indexed_by<
      name("testid"),
      eosio::const_mem_fun<
        tests,
        uint64_t, 
        &tests::test_key
      >
    >
  > time_tests_table;

ACTION clearall(name user) {
    // check(has_auth(get_self()), "You have no authority to clear documents table!");
    tests_table testtable(get_self(), get_self().value);
    for (auto itr = testtable.begin(); itr != testtable.end(); ) {
      itr = testtable.erase(itr);
      print(".");
    };
  }

ACTION clralltimes(name user) {
    // check(has_auth(get_self()), "You have no authority to clear documents table!");
    time_tests_table testtable(get_self(), get_self().value);
    for (auto itr = testtable.begin(); itr != testtable.end(); ) {
      itr = testtable.erase(itr);
      print(".");
    };
  }

  struct add_test
  {
    uint64_t size;
    eosio::time_point_sec timestamp;
  };

[[eosio::action]] add_test addtest (name creator, name testid, string description, std::vector<double> results) {
    // require_auth(creator);
    tests_table tests(get_self(), get_self().value);    
    uint64_t newid = tests.available_primary_key();
    eosio::time_point_sec timestamp = time_point(current_time_point());

    tests.emplace( get_self(), [&](auto &e) {
      e.id = newid;
      e.userid = creator;
      e.testid = testid;
      e.created_at = timestamp;
      e.description = description;  
      e.results = results;
    });
    
    add_test ret;
    return ret;
  }

[[eosio::action]] add_test addtimetest (name creator, name testid, string description, std::vector<double> results) {
    // require_auth(creator);
    time_tests_table tests(get_self(), get_self().value);    
    uint64_t newid = tests.available_primary_key();
    eosio::time_point_sec timestamp = time_point(current_time_point());

    tests.emplace( get_self(), [&](auto &e) {
      e.id = newid;
      e.userid = creator;
      e.testid = testid;
      e.created_at = timestamp;
      e.description = description;  
      e.results = results;
    });
    
    add_test ret;
    return ret;
  }

};

// cleos -u http://blockchain2.uni-plovdiv.net:8033 set contract llmtest ./ llmtest.wasm llmtest.abi
// eosio-cpp --abigen ./src/llmtest.cpp -o llmtest.wasm